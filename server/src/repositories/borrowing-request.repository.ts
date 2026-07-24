import { prisma } from "../config/prisma.js"
import {
  RequestStatus,
  ReturnCondition,
  TransactionType,
  type Prisma,
} from "../generated/prisma/client.js"

const requestSummarySelect = {
  id: true,
  requestCode: true,
  committeeId: true,
  submittedBy: true,
  requesterName: true,
  requesterPosition: true,
  purpose: true,
  borrowDate: true,
  expectedReturnDate: true,
  additionalNotes: true,
  status: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
  committee: {
    select: {
      id: true,
      name: true,
    },
  },
  submitter: {
    select: {
      id: true,
      username: true,
    },
  },
  _count: {
    select: {
      items: true,
    },
  },
} satisfies Prisma.BorrowingRequestSelect

const requestDetailsSelect = {
  id: true,
  requestCode: true,
  committeeId: true,
  submittedBy: true,
  requesterName: true,
  requesterPosition: true,
  purpose: true,
  borrowDate: true,
  expectedReturnDate: true,
  additionalNotes: true,
  status: true,
  rejectionReason: true,
  approvedBy: true,
  approvedAt: true,
  rejectedBy: true,
  rejectedAt: true,
  returnedAt: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
  committee: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
  submitter: {
    select: {
      id: true,
      username: true,
    },
  },
  items: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      itemId: true,
      quantityRequested: true,
      quantityApproved: true,
      quantityReturned: true,
      returnCondition: true,
      returnNotes: true,
      createdAt: true,
      item: {
        select: {
          id: true,
          itemCode: true,
          itemName: true,
          totalQuantity: true,
          availableQuantity: true,
          condition: true,
          isActive: true,
          category: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.BorrowingRequestSelect

type BorrowingRequestClient = Pick<
  Prisma.TransactionClient,
  | "borrowingRequest"
  | "borrowingRequestItem"
  | "item"
  | "inventoryTransaction"
>

const adminRequestSummarySelect = {
  id: true,
  requestCode: true,
  committeeId: true,
  submittedBy: true,
  requesterName: true,
  requesterPosition: true,
  purpose: true,
  borrowDate: true,
  expectedReturnDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  committee: {
    select: {
      id: true,
      name: true,
    },
  },
  submitter: {
    select: {
      id: true,
      username: true,
    },
  },
  items: {
    select: {
      quantityRequested: true,
    },
  },
} satisfies Prisma.BorrowingRequestSelect

export type BorrowingRequestSortField =
  | "createdAt"
  | "updatedAt"
  | "borrowDate"
  | "expectedReturnDate"
  | "status"

export interface MyRequestFilters {
  committeeId: string
  status?: RequestStatus
  search?: string
}

export interface FindMyRequestsOptions extends MyRequestFilters {
  skip: number
  take: number
  sortBy: BorrowingRequestSortField
  sortOrder: "asc" | "desc"
}

export interface AdminRequestFilters {
  status?: RequestStatus
  committeeId?: string
  search?: string
  borrowDateFrom?: Date
  borrowDateTo?: Date
}

export interface FindAllRequestsOptions extends AdminRequestFilters {
  skip: number
  take: number
  sortBy: BorrowingRequestSortField
  sortOrder: "asc" | "desc"
}

export interface CreateBorrowingRequestData {
  requestCode: string
  committeeId: string
  submittedBy: string
  requesterName: string
  requesterPosition: string
  purpose: string
  borrowDate: Date
  expectedReturnDate: Date
  additionalNotes: string | null
  items: Array<{
    itemId: string
    quantity: number
  }>
}

function buildMyRequestsWhere(
  filters: MyRequestFilters,
): Prisma.BorrowingRequestWhereInput {
  const where: Prisma.BorrowingRequestWhereInput = {
    committeeId: filters.committeeId,
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.search) {
    where.OR = [
      {
        requestCode: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        purpose: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        additionalNotes: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ]
  }

  return where
}

function buildAdminRequestsWhere(
  filters: AdminRequestFilters,
): Prisma.BorrowingRequestWhereInput {
  const where: Prisma.BorrowingRequestWhereInput = {}

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.committeeId) {
    where.committeeId = filters.committeeId
  }

  if (filters.borrowDateFrom || filters.borrowDateTo) {
    where.borrowDate = {
      gte: filters.borrowDateFrom,
      lte: filters.borrowDateTo,
    }
  }

  if (filters.search) {
    where.OR = [
      {
        requestCode: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        requesterName: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        requesterPosition: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        purpose: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        committee: {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      },
    ]
  }

  return where
}

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      committeeId: true,
    },
  })
}

export function findCommitteeById(id: string) {
  return prisma.committee.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  })
}

export function findItemsByIds(ids: string[]) {
  return prisma.item.findMany({
    where: {
      id: { in: ids },
    },
    select: {
      id: true,
      itemCode: true,
      itemName: true,
      totalQuantity: true,
      availableQuantity: true,
      condition: true,
      isActive: true,
      category: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
  })
}

export function createRequestWithItems(
  data: CreateBorrowingRequestData,
  client: BorrowingRequestClient = prisma,
) {
  return client.borrowingRequest.create({
    data: {
      requestCode: data.requestCode,
      committeeId: data.committeeId,
      submittedBy: data.submittedBy,
      requesterName: data.requesterName,
      requesterPosition: data.requesterPosition,
      purpose: data.purpose,
      borrowDate: data.borrowDate,
      expectedReturnDate: data.expectedReturnDate,
      additionalNotes: data.additionalNotes,
      status: RequestStatus.PENDING,
      items: {
        create: data.items.map((item) => ({
          itemId: item.itemId,
          quantityRequested: item.quantity,
        })),
      },
    },
    select: requestDetailsSelect,
  })
}

export function findMyRequests(options: FindMyRequestsOptions) {
  const orderBy: Prisma.BorrowingRequestOrderByWithRelationInput = {
    [options.sortBy]: options.sortOrder,
  }

  return prisma.borrowingRequest.findMany({
    where: buildMyRequestsWhere(options),
    select: requestSummarySelect,
    orderBy,
    skip: options.skip,
    take: options.take,
  })
}

export function countMyRequests(filters: MyRequestFilters) {
  return prisma.borrowingRequest.count({
    where: buildMyRequestsWhere(filters),
  })
}

export function findByIdWithDetails(id: string) {
  return prisma.borrowingRequest.findUnique({
    where: { id },
    select: requestDetailsSelect,
  })
}

export function findAll(options: FindAllRequestsOptions) {
  const orderBy: Prisma.BorrowingRequestOrderByWithRelationInput = {
    [options.sortBy]: options.sortOrder,
  }

  return prisma.borrowingRequest.findMany({
    where: buildAdminRequestsWhere(options),
    select: adminRequestSummarySelect,
    orderBy,
    skip: options.skip,
    take: options.take,
  })
}

export function countAll(filters: AdminRequestFilters) {
  return prisma.borrowingRequest.count({
    where: buildAdminRequestsWhere(filters),
  })
}

export function findPendingByIdWithDetails(
  id: string,
  client: BorrowingRequestClient = prisma,
) {
  return client.borrowingRequest.findFirst({
    where: {
      id,
      status: RequestStatus.PENDING,
    },
    select: requestDetailsSelect,
  })
}

export function findReturnableByIdWithDetails(
  id: string,
  client: BorrowingRequestClient = prisma,
) {
  return client.borrowingRequest.findFirst({
    where: {
      id,
      status: {
        in: [RequestStatus.APPROVED, RequestStatus.BORROWED],
      },
    },
    select: requestDetailsSelect,
  })
}

export function findByIdWithDetailsInTransaction(
  id: string,
  client: BorrowingRequestClient,
) {
  return client.borrowingRequest.findUnique({
    where: { id },
    select: requestDetailsSelect,
  })
}

export function approveRequest(
  id: string,
  approvedBy: string,
  client: BorrowingRequestClient,
) {
  return client.borrowingRequest.updateMany({
    where: {
      id,
      status: RequestStatus.PENDING,
    },
    data: {
      status: RequestStatus.APPROVED,
      approvedBy,
      approvedAt: new Date(),
    },
  })
}

export function rejectRequest(
  id: string,
  rejectedBy: string,
  reason: string,
  client: BorrowingRequestClient,
) {
  return client.borrowingRequest.updateMany({
    where: {
      id,
      status: RequestStatus.PENDING,
    },
    data: {
      status: RequestStatus.REJECTED,
      rejectionReason: reason,
      rejectedBy,
      rejectedAt: new Date(),
    },
  })
}

export function markRequestReturned(
  id: string,
  client: BorrowingRequestClient,
) {
  return client.borrowingRequest.updateMany({
    where: {
      id,
      status: {
        in: [RequestStatus.APPROVED, RequestStatus.BORROWED],
      },
    },
    data: {
      status: RequestStatus.RETURNED,
      returnedAt: new Date(),
    },
  })
}

export function decrementItemStockConditionally(
  itemId: string,
  quantity: number,
  client: BorrowingRequestClient,
) {
  return client.item.updateMany({
    where: {
      id: itemId,
      isActive: true,
      availableQuantity: { gte: quantity },
      category: {
        isActive: true,
      },
    },
    data: {
      availableQuantity: {
        decrement: quantity,
      },
    },
  })
}

export function findItemAvailability(
  itemId: string,
  client: BorrowingRequestClient,
) {
  return client.item.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      availableQuantity: true,
    },
  })
}

export function incrementItemStockConditionally(
  itemId: string,
  expectedAvailability: number,
  quantity: number,
  client: BorrowingRequestClient,
) {
  return client.item.updateMany({
    where: {
      id: itemId,
      availableQuantity: expectedAvailability,
    },
    data: {
      availableQuantity: {
        increment: quantity,
      },
    },
  })
}

export function setApprovedQuantity(
  requestItemId: string,
  quantity: number,
  client: BorrowingRequestClient,
) {
  return client.borrowingRequestItem.update({
    where: { id: requestItemId },
    data: { quantityApproved: quantity },
  })
}

export function setReturnedItem(
  requestItemId: string,
  quantity: number,
  condition: ReturnCondition,
  notes: string | null,
  client: BorrowingRequestClient,
) {
  return client.borrowingRequestItem.update({
    where: { id: requestItemId },
    data: {
      quantityReturned: quantity,
      returnCondition: condition,
      returnNotes: notes,
    },
  })
}

export interface InventoryTransactionData {
  itemId: string
  borrowingRequestId: string
  performedBy: string
  quantity: number
  quantityBefore: number
  quantityAfter: number
  remarks: string
  transactionType?: TransactionType
}

export type BorrowHistorySortField =
  | "createdAt"
  | "borrowDate"
  | "expectedReturnDate"
  | "returnedAt"
  | "updatedAt"
  | "status"

export interface BorrowHistoryFilters {
  committeeId?: string
  status?: RequestStatus
  itemId?: string
  search?: string
  borrowDateFrom?: Date
  borrowDateTo?: Date
  returnedFrom?: Date
  returnedTo?: Date
}

export interface FindBorrowHistoryOptions extends BorrowHistoryFilters {
  skip: number
  take: number
  sortBy: BorrowHistorySortField
  sortOrder: "asc" | "desc"
}

function buildBorrowHistoryWhere(
  filters: BorrowHistoryFilters,
): Prisma.BorrowingRequestWhereInput {
  const where: Prisma.BorrowingRequestWhereInput = {}

  if (filters.committeeId) {
    where.committeeId = filters.committeeId
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.itemId) {
    where.items = {
      some: {
        itemId: filters.itemId,
      },
    }
  }

  if (filters.borrowDateFrom || filters.borrowDateTo) {
    where.borrowDate = {
      gte: filters.borrowDateFrom,
      lte: filters.borrowDateTo,
    }
  }

  if (filters.returnedFrom || filters.returnedTo) {
    where.returnedAt = {
      gte: filters.returnedFrom,
      lte: filters.returnedTo,
    }
  }

  if (filters.search) {
    where.OR = [
      {
        requesterName: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        requesterPosition: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        purpose: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        committee: {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      },
      {
        items: {
          some: {
            item: {
              OR: [
                {
                  itemName: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
                {
                  itemCode: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
      },
    ]
  }

  return where
}

const borrowHistorySelect = {
  id: true,
  requestCode: true,
  status: true,
  purpose: true,
  requesterName: true,
  requesterPosition: true,
  borrowDate: true,
  expectedReturnDate: true,
  returnedAt: true,
  createdAt: true,
  updatedAt: true,
  committee: {
    select: {
      id: true,
      name: true,
    },
  },
  submitter: {
    select: {
      id: true,
      username: true,
    },
  },
  items: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      itemId: true,
      quantityRequested: true,
      returnCondition: true,
      returnNotes: true,
      item: {
        select: {
          id: true,
          itemCode: true,
          itemName: true,
        },
      },
    },
  },
} satisfies Prisma.BorrowingRequestSelect

export function findBorrowHistory(
  options: FindBorrowHistoryOptions,
) {
  const orderBy: Prisma.BorrowingRequestOrderByWithRelationInput = {
    [options.sortBy]: options.sortOrder,
  }

  return prisma.borrowingRequest.findMany({
    where: buildBorrowHistoryWhere(options),
    select: borrowHistorySelect,
    orderBy,
    skip: options.skip,
    take: options.take,
  })
}

export function countBorrowHistory(filters: BorrowHistoryFilters) {
  return prisma.borrowingRequest.count({
    where: buildBorrowHistoryWhere(filters),
  })
}

export function findHistoryItemById(id: string) {
  return prisma.item.findUnique({
    where: { id },
    select: {
      id: true,
      itemCode: true,
      itemName: true,
      description: true,
      condition: true,
      isActive: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

export function findItemBorrowHistory(
  itemId: string,
  committeeId: string | undefined,
  skip: number,
  take: number,
) {
  return prisma.borrowingRequestItem.findMany({
    where: {
      itemId,
      borrowingRequest:
        committeeId === undefined ? undefined : { committeeId },
    },
    select: {
      id: true,
      quantityRequested: true,
      quantityApproved: true,
      quantityReleased: true,
      quantityReturned: true,
      returnCondition: true,
      returnNotes: true,
      borrowingRequest: {
        select: {
          id: true,
          requestCode: true,
          status: true,
          requesterName: true,
          requesterPosition: true,
          borrowDate: true,
          expectedReturnDate: true,
          returnedAt: true,
          createdAt: true,
          committee: {
            select: {
              id: true,
              name: true,
            },
          },
          submitter: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
    orderBy: {
      borrowingRequest: {
        createdAt: "desc",
      },
    },
    skip,
    take,
  })
}

export function countItemBorrowHistory(
  itemId: string,
  committeeId?: string,
) {
  return prisma.borrowingRequestItem.count({
    where: {
      itemId,
      borrowingRequest:
        committeeId === undefined ? undefined : { committeeId },
    },
  })
}

export function findInventoryTransactionReferences(
  itemId: string,
  borrowingRequestIds: string[],
) {
  return prisma.inventoryTransaction.findMany({
    where: {
      itemId,
      borrowingRequestId: {
        in: borrowingRequestIds,
      },
    },
    select: {
      id: true,
      borrowingRequestId: true,
      transactionType: true,
      quantity: true,
      quantityBefore: true,
      quantityAfter: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  })
}

export function createInventoryTransactions(
  transactions: InventoryTransactionData[],
  client: BorrowingRequestClient,
) {
  return client.inventoryTransaction.createMany({
    data: transactions.map((transaction) => ({
      ...transaction,
      transactionType:
        transaction.transactionType ?? TransactionType.BORROWED,
    })),
  })
}

export function transaction<T>(
  operation: (client: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(operation)
}
