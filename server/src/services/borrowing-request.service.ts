import { randomUUID } from "node:crypto"

import {
  Prisma,
  UserRole,
} from "../generated/prisma/client.js"
import * as auditRepository from "../repositories/audit.repository.js"
import * as borrowingRequestRepository from "../repositories/borrowing-request.repository.js"
import { AppError } from "../utils/AppError.js"
import type {
  ApproveBorrowingRequestInput,
  BorrowingHistoryQuery,
  CreateBorrowingRequestInput,
  ItemBorrowingHistoryQuery,
  ListAllBorrowingRequestsQuery,
  ListMyBorrowingRequestsQuery,
  RejectBorrowingRequestInput,
  ReturnBorrowingRequestInput,
} from "../validators/borrowing-request.validation.js"

export interface BorrowingRequestActorContext {
  userId: string
  role: UserRole
  committeeId: string | null
  ipAddress?: string
}

function normalizeNullableString(
  value: string | null | undefined,
): string | null {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function toDatabaseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function createRequestCode(): string {
  return `BR-${randomUUID()}`
}

function toAuditValues(
  request: Awaited<
    ReturnType<
      typeof borrowingRequestRepository.createRequestWithItems
    >
  >,
): Prisma.InputJsonObject {
  return {
    id: request.id,
    requestCode: request.requestCode,
    committeeId: request.committeeId,
    submittedBy: request.submittedBy,
    purpose: request.purpose,
    borrowDate: request.borrowDate.toISOString(),
    expectedReturnDate: request.expectedReturnDate.toISOString(),
    status: request.status,
    items: request.items.map((requestItem) => ({
      itemId: requestItem.itemId,
      quantity: requestItem.quantityRequested,
    })),
  }
}

async function requireCommitteeActor(
  actor: BorrowingRequestActorContext,
) {
  if (actor.role !== UserRole.COMMITTEE) {
    throw new AppError(403, "A committee account is required.")
  }

  const user = await borrowingRequestRepository.findUserById(actor.userId)

  if (!user) {
    throw new AppError(401, "Authenticated user no longer exists.")
  }

  if (!user.isActive) {
    throw new AppError(403, "Account is inactive.")
  }

  if (user.role !== UserRole.COMMITTEE) {
    throw new AppError(403, "A committee account is required.")
  }

  if (
    !actor.committeeId ||
    !user.committeeId ||
    actor.committeeId !== user.committeeId
  ) {
    throw new AppError(
      403,
      "Committee account membership is invalid.",
    )
  }

  const committee =
    await borrowingRequestRepository.findCommitteeById(user.committeeId)

  if (!committee) {
    throw new AppError(404, "Committee not found.")
  }

  if (!committee.isActive) {
    throw new AppError(409, "Committee is inactive.")
  }

  return { user, committee }
}

function assertNoDuplicateItems(
  items: CreateBorrowingRequestInput["items"],
): void {
  const itemIds = new Set(items.map((item) => item.itemId))

  if (itemIds.size !== items.length) {
    throw new AppError(
      409,
      "Duplicate items are not allowed in a borrowing request.",
    )
  }
}

async function validateRequestedItems(
  requestedItems: CreateBorrowingRequestInput["items"],
) {
  assertNoDuplicateItems(requestedItems)

  const items = await borrowingRequestRepository.findItemsByIds(
    requestedItems.map((item) => item.itemId),
  )

  if (items.length !== requestedItems.length) {
    throw new AppError(
      404,
      "One or more requested items were not found.",
    )
  }

  const itemsById = new Map(items.map((item) => [item.id, item]))

  for (const requestedItem of requestedItems) {
    const item = itemsById.get(requestedItem.itemId)

    if (!item) {
      throw new AppError(404, "Requested item not found.")
    }

    if (!item.isActive) {
      throw new AppError(
        409,
        `Item "${item.itemCode}" is inactive.`,
      )
    }

    if (!item.category.isActive) {
      throw new AppError(
        409,
        `The category for item "${item.itemCode}" is inactive.`,
      )
    }

    if (requestedItem.quantity > item.totalQuantity) {
      throw new AppError(
        409,
        `Requested quantity for item "${item.itemCode}" exceeds its total quantity.`,
      )
    }

    if (requestedItem.quantity > item.availableQuantity) {
      throw new AppError(
        409,
        `Requested quantity for item "${item.itemCode}" exceeds current availability.`,
      )
    }
  }

  return items
}

function toRequestSummary(
  request: Awaited<
    ReturnType<typeof borrowingRequestRepository.findMyRequests>
  >[number],
) {
  const { _count, ...summary } = request
  return {
    ...summary,
    itemCount: _count.items,
  }
}

function toAdminRequestSummary(
  request: Awaited<
    ReturnType<typeof borrowingRequestRepository.findAll>
  >[number],
) {
  const { items, ...summary } = request
  return {
    ...summary,
    itemCount: items.length,
    totalRequestedQuantity: items.reduce(
      (total, item) => total + item.quantityRequested,
      0,
    ),
  }
}

async function requireSuperAdminActor(
  actor: BorrowingRequestActorContext,
) {
  if (actor.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, "SUPER_ADMIN access is required.")
  }

  const user = await borrowingRequestRepository.findUserById(actor.userId)

  if (!user) {
    throw new AppError(401, "Authenticated user no longer exists.")
  }

  if (!user.isActive || user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, "SUPER_ADMIN access is required.")
  }

  return user
}

function invalidTransitionError(): AppError {
  return new AppError(
    409,
    "Only pending borrowing requests can be reviewed.",
  )
}

function invalidReturnTransitionError(): AppError {
  return new AppError(
    409,
    "Only approved or borrowed requests can be returned.",
  )
}

function normalizeOptionalRemarks(
  remarks: string | undefined,
): string | undefined {
  const normalized = remarks?.trim()
  return normalized ? normalized : undefined
}

export async function createBorrowingRequest(
  input: CreateBorrowingRequestInput,
  actor: BorrowingRequestActorContext,
) {
  const { user, committee } = await requireCommitteeActor(actor)
  await validateRequestedItems(input.items)

  const data: borrowingRequestRepository.CreateBorrowingRequestData = {
    requestCode: createRequestCode(),
    committeeId: committee.id,
    submittedBy: user.id,
    requesterName: input.requesterName.trim(),
    requesterPosition: input.requesterPosition.trim(),
    purpose: input.purpose.trim(),
    borrowDate: toDatabaseDate(input.borrowDate),
    expectedReturnDate: toDatabaseDate(input.expectedReturnDate),
    additionalNotes: normalizeNullableString(input.additionalNotes),
    items: input.items,
  }

  return borrowingRequestRepository.transaction(async (transaction) => {
    const request =
      await borrowingRequestRepository.createRequestWithItems(
        data,
        transaction,
      )

    await auditRepository.create(
      {
        userId: user.id,
        committeeId: committee.id,
        action: "BORROWING_REQUEST_CREATED",
        entityType: "BorrowingRequest",
        entityId: request.id,
        description: `Borrowing request "${request.requestCode}" was created.`,
        newValues: toAuditValues(request),
        ipAddress: actor.ipAddress,
      },
      transaction,
    )

    return request
  })
}

export async function getMyBorrowingRequests(
  query: ListMyBorrowingRequestsQuery,
  actor: BorrowingRequestActorContext,
) {
  const { committee } = await requireCommitteeActor(actor)
  const filters: borrowingRequestRepository.MyRequestFilters = {
    committeeId: committee.id,
    status: query.status,
    search: query.search,
  }
  const [requests, total] = await Promise.all([
    borrowingRequestRepository.findMyRequests({
      ...filters,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }),
    borrowingRequestRepository.countMyRequests(filters),
  ])

  return {
    requests: requests.map(toRequestSummary),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  }
}

export async function getBorrowingRequest(
  id: string,
  actor: BorrowingRequestActorContext,
) {
  const request =
    await borrowingRequestRepository.findByIdWithDetails(id)

  if (!request) {
    throw new AppError(404, "Borrowing request not found.")
  }

  if (actor.role === UserRole.COMMITTEE) {
    const { committee } = await requireCommitteeActor(actor)

    if (request.committeeId !== committee.id) {
      throw new AppError(
        403,
        "You cannot access another committee's borrowing request.",
      )
    }
  } else if (actor.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, "You cannot access this borrowing request.")
  }

  return request
}

export async function getAllBorrowingRequests(
  query: ListAllBorrowingRequestsQuery,
  actor: BorrowingRequestActorContext,
) {
  await requireSuperAdminActor(actor)

  const filters: borrowingRequestRepository.AdminRequestFilters = {
    status: query.status,
    committeeId: query.committeeId,
    search: query.search,
    borrowDateFrom: query.borrowDateFrom
      ? toDatabaseDate(query.borrowDateFrom)
      : undefined,
    borrowDateTo: query.borrowDateTo
      ? toDatabaseDate(query.borrowDateTo)
      : undefined,
  }
  const [requests, total] = await Promise.all([
    borrowingRequestRepository.findAll({
      ...filters,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }),
    borrowingRequestRepository.countAll(filters),
  ])

  return {
    requests: requests.map(toAdminRequestSummary),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  }
}

export async function approveBorrowingRequest(
  id: string,
  input: ApproveBorrowingRequestInput,
  actor: BorrowingRequestActorContext,
) {
  const admin = await requireSuperAdminActor(actor)
  const remarks = normalizeOptionalRemarks(input.remarks)

  return borrowingRequestRepository.transaction(async (transaction) => {
    const pendingRequest =
      await borrowingRequestRepository.findPendingByIdWithDetails(
        id,
        transaction,
      )

    if (!pendingRequest) {
      const existingRequest =
        await borrowingRequestRepository.findByIdWithDetailsInTransaction(
          id,
          transaction,
        )

      if (!existingRequest) {
        throw new AppError(404, "Borrowing request not found.")
      }

      throw invalidTransitionError()
    }

    if (pendingRequest.items.length === 0) {
      throw new AppError(
        409,
        "Borrowing request must contain at least one item.",
      )
    }

    if (!pendingRequest.committee.isActive) {
      throw new AppError(409, "Committee is inactive.")
    }

    for (const requestItem of pendingRequest.items) {
      if (requestItem.quantityRequested < 1) {
        throw new AppError(409, "Requested item quantity is invalid.")
      }

      if (!requestItem.item.isActive) {
        throw new AppError(
          409,
          `Item "${requestItem.item.itemCode}" is inactive.`,
        )
      }

      if (!requestItem.item.category.isActive) {
        throw new AppError(
          409,
          `The category for item "${requestItem.item.itemCode}" is inactive.`,
        )
      }

      if (
        requestItem.quantityRequested >
        requestItem.item.availableQuantity
      ) {
        throw new AppError(
          409,
          `Insufficient stock for item "${requestItem.item.itemCode}".`,
        )
      }
    }

    const claimResult = await borrowingRequestRepository.approveRequest(
      id,
      admin.id,
      transaction,
    )

    if (claimResult.count !== 1) {
      throw invalidTransitionError()
    }

    const stockChanges: borrowingRequestRepository.InventoryTransactionData[] =
      []
    const orderedItems = [...pendingRequest.items].sort((left, right) =>
      left.itemId.localeCompare(right.itemId),
    )

    for (const requestItem of orderedItems) {
      const decrementResult =
        await borrowingRequestRepository.decrementItemStockConditionally(
          requestItem.itemId,
          requestItem.quantityRequested,
          transaction,
        )

      if (decrementResult.count !== 1) {
        throw new AppError(
          409,
          `Item "${requestItem.item.itemCode}" is inactive or has insufficient stock.`,
        )
      }

      const updatedAvailability =
        await borrowingRequestRepository.findItemAvailability(
          requestItem.itemId,
          transaction,
        )

      if (!updatedAvailability) {
        throw new AppError(404, "Approved item no longer exists.")
      }

      await borrowingRequestRepository.setApprovedQuantity(
        requestItem.id,
        requestItem.quantityRequested,
        transaction,
      )

      stockChanges.push({
        itemId: requestItem.itemId,
        borrowingRequestId: pendingRequest.id,
        performedBy: admin.id,
        quantity: requestItem.quantityRequested,
        quantityBefore:
          updatedAvailability.availableQuantity +
          requestItem.quantityRequested,
        quantityAfter: updatedAvailability.availableQuantity,
        remarks:
          remarks ??
          `Approved borrowing request ${pendingRequest.requestCode}.`,
      })
    }

    await borrowingRequestRepository.createInventoryTransactions(
      stockChanges,
      transaction,
    )

    const approvedRequest =
      await borrowingRequestRepository.findByIdWithDetailsInTransaction(
        id,
        transaction,
      )

    if (!approvedRequest) {
      throw new AppError(404, "Borrowing request not found.")
    }

    await auditRepository.create(
      {
        userId: admin.id,
        committeeId: approvedRequest.committeeId,
        action: "BORROWING_REQUEST_APPROVED",
        entityType: "BorrowingRequest",
        entityId: approvedRequest.id,
        description: `Borrowing request "${approvedRequest.requestCode}" was approved.`,
        oldValues: {
          status: pendingRequest.status,
          items: stockChanges.map((change) => ({
            itemId: change.itemId,
            quantity: change.quantity,
            availableQuantity: change.quantityBefore,
          })),
        },
        newValues: {
          status: approvedRequest.status,
          approvedBy: approvedRequest.approvedBy,
          approvedAt:
            approvedRequest.approvedAt?.toISOString() ?? null,
          remarks: remarks ?? null,
          items: stockChanges.map((change) => ({
            itemId: change.itemId,
            quantity: change.quantity,
            availableQuantity: change.quantityAfter,
          })),
        },
        ipAddress: actor.ipAddress,
      },
      transaction,
    )

    return approvedRequest
  })
}

export async function rejectBorrowingRequest(
  id: string,
  input: RejectBorrowingRequestInput,
  actor: BorrowingRequestActorContext,
) {
  const admin = await requireSuperAdminActor(actor)
  const reason = input.reason.trim()

  return borrowingRequestRepository.transaction(async (transaction) => {
    const pendingRequest =
      await borrowingRequestRepository.findPendingByIdWithDetails(
        id,
        transaction,
      )

    if (!pendingRequest) {
      const existingRequest =
        await borrowingRequestRepository.findByIdWithDetailsInTransaction(
          id,
          transaction,
        )

      if (!existingRequest) {
        throw new AppError(404, "Borrowing request not found.")
      }

      throw invalidTransitionError()
    }

    const rejectResult = await borrowingRequestRepository.rejectRequest(
      id,
      admin.id,
      reason,
      transaction,
    )

    if (rejectResult.count !== 1) {
      throw invalidTransitionError()
    }

    const rejectedRequest =
      await borrowingRequestRepository.findByIdWithDetailsInTransaction(
        id,
        transaction,
      )

    if (!rejectedRequest) {
      throw new AppError(404, "Borrowing request not found.")
    }

    await auditRepository.create(
      {
        userId: admin.id,
        committeeId: rejectedRequest.committeeId,
        action: "BORROWING_REQUEST_REJECTED",
        entityType: "BorrowingRequest",
        entityId: rejectedRequest.id,
        description: `Borrowing request "${rejectedRequest.requestCode}" was rejected.`,
        oldValues: {
          status: pendingRequest.status,
        },
        newValues: {
          status: rejectedRequest.status,
          rejectionReason: rejectedRequest.rejectionReason,
          rejectedBy: rejectedRequest.rejectedBy,
          rejectedAt:
            rejectedRequest.rejectedAt?.toISOString() ?? null,
        },
        ipAddress: actor.ipAddress,
      },
      transaction,
    )

    return rejectedRequest
  })
}

export async function returnBorrowingRequest(
  id: string,
  input: ReturnBorrowingRequestInput,
  actor: BorrowingRequestActorContext,
) {
  const admin = await requireSuperAdminActor(actor)
  const notes = normalizeNullableString(input.notes)

  return borrowingRequestRepository.transaction(async (transaction) => {
    const returnableRequest =
      await borrowingRequestRepository.findReturnableByIdWithDetails(
        id,
        transaction,
      )

    if (!returnableRequest) {
      const existingRequest =
        await borrowingRequestRepository.findByIdWithDetailsInTransaction(
          id,
          transaction,
        )

      if (!existingRequest) {
        throw new AppError(404, "Borrowing request not found.")
      }

      throw invalidReturnTransitionError()
    }

    if (returnableRequest.items.length === 0) {
      throw new AppError(
        409,
        "Borrowing request must contain at least one item.",
      )
    }

    const claimResult =
      await borrowingRequestRepository.markRequestReturned(
        id,
        transaction,
      )

    if (claimResult.count !== 1) {
      throw invalidReturnTransitionError()
    }

    const stockChanges: borrowingRequestRepository.InventoryTransactionData[] =
      []
    const orderedItems = [...returnableRequest.items].sort((left, right) =>
      left.itemId.localeCompare(right.itemId),
    )

    for (const requestItem of orderedItems) {
      const approvedQuantity =
        requestItem.quantityApproved ?? requestItem.quantityRequested

      if (
        approvedQuantity < 1 ||
        requestItem.quantityReturned !== 0 ||
        requestItem.item.availableQuantity + approvedQuantity >
          requestItem.item.totalQuantity
      ) {
        throw new AppError(
          409,
          `Return quantities for item "${requestItem.item.itemCode}" are inconsistent.`,
        )
      }

      const incrementResult =
        await borrowingRequestRepository.incrementItemStockConditionally(
          requestItem.itemId,
          requestItem.item.availableQuantity,
          approvedQuantity,
          transaction,
        )

      if (incrementResult.count !== 1) {
        throw new AppError(
          409,
          `Inventory changed while returning item "${requestItem.item.itemCode}". Try again.`,
        )
      }

      const updatedAvailability =
        await borrowingRequestRepository.findItemAvailability(
          requestItem.itemId,
          transaction,
        )

      if (!updatedAvailability) {
        throw new AppError(404, "Returned item no longer exists.")
      }

      await borrowingRequestRepository.setReturnedItem(
        requestItem.id,
        approvedQuantity,
        input.condition,
        notes,
        transaction,
      )

      stockChanges.push({
        itemId: requestItem.itemId,
        borrowingRequestId: returnableRequest.id,
        performedBy: admin.id,
        transactionType: "RETURNED",
        quantity: approvedQuantity,
        quantityBefore:
          updatedAvailability.availableQuantity - approvedQuantity,
        quantityAfter: updatedAvailability.availableQuantity,
        remarks:
          notes ??
          `Processed return for borrowing request ${returnableRequest.requestCode}.`,
      })
    }

    await borrowingRequestRepository.createInventoryTransactions(
      stockChanges,
      transaction,
    )

    const returnedRequest =
      await borrowingRequestRepository.findByIdWithDetailsInTransaction(
        id,
        transaction,
      )

    if (!returnedRequest) {
      throw new AppError(404, "Borrowing request not found.")
    }

    await auditRepository.create(
      {
        userId: admin.id,
        committeeId: returnedRequest.committeeId,
        action: "BORROWING_REQUEST_RETURNED",
        entityType: "BorrowingRequest",
        entityId: returnedRequest.id,
        description: `Return for borrowing request "${returnedRequest.requestCode}" was processed.`,
        oldValues: {
          status: returnableRequest.status,
          items: stockChanges.map((change) => ({
            itemId: change.itemId,
            quantity: change.quantity,
            availableQuantity: change.quantityBefore,
          })),
        },
        newValues: {
          status: returnedRequest.status,
          returnedAt:
            returnedRequest.returnedAt?.toISOString() ?? null,
          condition: input.condition,
          items: stockChanges.map((change) => ({
            itemId: change.itemId,
            quantity: change.quantity,
            availableQuantity: change.quantityAfter,
          })),
        },
        ipAddress: actor.ipAddress,
      },
      transaction,
    )

    return returnedRequest
  })
}

function toReturnedBoundary(
  value: string | undefined,
  endOfDay: boolean,
): Date | undefined {
  if (!value) {
    return undefined
  }

  if (value.length === 10) {
    return new Date(
      `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`,
    )
  }

  return new Date(value)
}

async function resolveHistoryCommitteeId(
  actor: BorrowingRequestActorContext,
  requestedCommitteeId?: string,
): Promise<string | undefined> {
  if (actor.role === UserRole.SUPER_ADMIN) {
    await requireSuperAdminActor(actor)
    return requestedCommitteeId
  }

  if (actor.role !== UserRole.COMMITTEE) {
    throw new AppError(403, "You cannot view borrowing history.")
  }

  const user = await borrowingRequestRepository.findUserById(actor.userId)

  if (!user) {
    throw new AppError(401, "Authenticated user no longer exists.")
  }

  if (!user.isActive || user.role !== UserRole.COMMITTEE) {
    throw new AppError(403, "A committee account is required.")
  }

  if (
    !actor.committeeId ||
    !user.committeeId ||
    actor.committeeId !== user.committeeId
  ) {
    throw new AppError(
      403,
      "Committee account membership is invalid.",
    )
  }

  if (
    requestedCommitteeId &&
    requestedCommitteeId !== user.committeeId
  ) {
    throw new AppError(
      403,
      "You cannot view another committee's borrowing history.",
    )
  }

  const committee =
    await borrowingRequestRepository.findCommitteeById(user.committeeId)

  if (!committee) {
    throw new AppError(404, "Committee not found.")
  }

  return committee.id
}

function toBorrowHistoryDto(
  record: Awaited<
    ReturnType<typeof borrowingRequestRepository.findBorrowHistory>
  >[number],
) {
  const { submitter, items, ...request } = record

  return {
    ...request,
    requestedBy: submitter,
    items: items.map((requestItem) => ({
      id: requestItem.id,
      itemId: requestItem.itemId,
      itemCode: requestItem.item.itemCode,
      itemName: requestItem.item.itemName,
      quantityRequested: requestItem.quantityRequested,
      returnCondition: requestItem.returnCondition,
      remarks: requestItem.returnNotes,
    })),
  }
}

export async function getBorrowingHistory(
  query: BorrowingHistoryQuery,
  actor: BorrowingRequestActorContext,
) {
  const committeeId = await resolveHistoryCommitteeId(
    actor,
    query.committeeId,
  )
  const filters: borrowingRequestRepository.BorrowHistoryFilters = {
    committeeId,
    status: query.status,
    itemId: query.itemId,
    search: query.search,
    borrowDateFrom: query.borrowDateFrom
      ? toDatabaseDate(query.borrowDateFrom)
      : undefined,
    borrowDateTo: query.borrowDateTo
      ? toDatabaseDate(query.borrowDateTo)
      : undefined,
    returnedFrom: toReturnedBoundary(query.returnedFrom, false),
    returnedTo: toReturnedBoundary(query.returnedTo, true),
  }
  const [records, total] = await Promise.all([
    borrowingRequestRepository.findBorrowHistory({
      ...filters,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }),
    borrowingRequestRepository.countBorrowHistory(filters),
  ])

  return {
    history: records.map(toBorrowHistoryDto),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  }
}

export async function getItemBorrowingHistory(
  itemId: string,
  query: ItemBorrowingHistoryQuery,
  actor: BorrowingRequestActorContext,
) {
  const item =
    await borrowingRequestRepository.findHistoryItemById(itemId)

  if (!item) {
    throw new AppError(404, "Item not found.")
  }

  const committeeId = await resolveHistoryCommitteeId(actor)
  const [records, total] = await Promise.all([
    borrowingRequestRepository.findItemBorrowHistory(
      itemId,
      committeeId,
      (query.page - 1) * query.limit,
      query.limit,
    ),
    borrowingRequestRepository.countItemBorrowHistory(
      itemId,
      committeeId,
    ),
  ])
  const requestIds = records.map(
    (record) => record.borrowingRequest.id,
  )
  const transactionReferences =
    requestIds.length === 0
      ? []
      : await borrowingRequestRepository.findInventoryTransactionReferences(
          itemId,
          requestIds,
        )
  const transactionsByRequest = new Map<
    string,
    typeof transactionReferences
  >()

  for (const transaction of transactionReferences) {
    if (!transaction.borrowingRequestId) {
      continue
    }

    const existing =
      transactionsByRequest.get(transaction.borrowingRequestId) ?? []
    existing.push(transaction)
    transactionsByRequest.set(
      transaction.borrowingRequestId,
      existing,
    )
  }

  return {
    item,
    history: records.map((record) => ({
      borrowingRequestId: record.borrowingRequest.id,
      requestCode: record.borrowingRequest.requestCode,
      committee: record.borrowingRequest.committee,
      requester: {
        name: record.borrowingRequest.requesterName,
        position: record.borrowingRequest.requesterPosition,
        user: record.borrowingRequest.submitter,
      },
      borrowDate: record.borrowingRequest.borrowDate,
      expectedReturnDate:
        record.borrowingRequest.expectedReturnDate,
      returnedAt: record.borrowingRequest.returnedAt,
      status: record.borrowingRequest.status,
      quantityRequested: record.quantityRequested,
      quantityApproved: record.quantityApproved,
      quantityReleased: record.quantityReleased,
      quantityReturned: record.quantityReturned,
      returnCondition: record.returnCondition,
      returnNotes: record.returnNotes,
      inventoryTransactions:
        transactionsByRequest.get(record.borrowingRequest.id) ?? [],
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  }
}
