import { randomUUID } from "node:crypto"

import { Prisma } from "../generated/prisma/client.js"
import * as auditRepository from "../repositories/audit.repository.js"
import * as itemRepository from "../repositories/item.repository.js"
import { AppError } from "../utils/AppError.js"
import type {
  CreateItemInput,
  ListItemsQuery,
  UpdateItemInput,
} from "../validators/item.validation.js"

export interface ItemAuditContext {
  userId: string
  ipAddress?: string
}

type ItemRecord = NonNullable<
  Awaited<ReturnType<typeof itemRepository.findById>>
>

function normalizeNullableString(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined || value === null) {
    return value
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function toAuditValues(item: ItemRecord): Prisma.InputJsonObject {
  return {
    id: item.id,
    itemCode: item.itemCode,
    categoryId: item.categoryId,
    itemName: item.itemName,
    description: item.description,
    totalQuantity: item.totalQuantity,
    availableQuantity: item.availableQuantity,
    condition: item.condition,
    storageLocation: item.storageLocation,
    googleDriveFolderLink: item.googleDriveFolderLink,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

function unsafeDeactivationError(): AppError {
  return new AppError(
    409,
    "Item cannot be deactivated while units are borrowed or active borrowing requests reference it.",
  )
}

function handleUniqueConstraint(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError(
      409,
      "A unique item code could not be generated. Please try again.",
    )
  }

  throw error
}

function generateItemCode(): string {
  const identifier = randomUUID()
    .replaceAll("-", "")
    .slice(0, 10)
    .toUpperCase()

  return `ITM-${identifier}`
}

async function requireItem(id: string) {
  const item = await itemRepository.findById(id)

  if (!item) {
    throw new AppError(404, "Item not found.")
  }

  return item
}

async function requireActiveCategory(categoryId: string) {
  const category = await itemRepository.findCategoryById(categoryId)

  if (!category) {
    throw new AppError(404, "Category not found.")
  }

  if (!category.isActive) {
    throw new AppError(409, "Inactive categories cannot be used by items.")
  }

  return category
}

function getBorrowedQuantity(item: ItemRecord): number {
  const borrowedQuantity =
    item.totalQuantity - item.availableQuantity

  if (
    item.availableQuantity < 0 ||
    item.availableQuantity > item.totalQuantity
  ) {
    throw new AppError(409, "Item quantity data is inconsistent.")
  }

  return borrowedQuantity
}

async function assertSafeToDeactivate(
  item: ItemRecord,
  transaction: Prisma.TransactionClient,
): Promise<void> {
  if (getBorrowedQuantity(item) > 0) {
    throw unsafeDeactivationError()
  }

  const activeBorrowingRecords =
    await itemRepository.countActiveBorrowingRecords(
      item.id,
      transaction,
    )

  if (activeBorrowingRecords > 0) {
    throw unsafeDeactivationError()
  }
}

function getAuditAction(
  before: ItemRecord,
  after: ItemRecord,
): string {
  if (before.isActive !== after.isActive) {
    return after.isActive ? "ITEM_ACTIVATED" : "ITEM_DEACTIVATED"
  }

  if (before.totalQuantity !== after.totalQuantity) {
    return "ITEM_QUANTITY_UPDATED"
  }

  return "ITEM_UPDATED"
}

function getAuditVerb(action: string): string {
  switch (action) {
    case "ITEM_ACTIVATED":
      return "activated"
    case "ITEM_DEACTIVATED":
      return "deactivated"
    case "ITEM_QUANTITY_UPDATED":
      return "quantity updated"
    default:
      return "updated"
  }
}

export async function getItems(query: ListItemsQuery) {
  const sortBy =
    query.sortBy === "name" ? "itemName" : query.sortBy
  const filters: itemRepository.ItemFilters = {
    search: query.search,
    categoryId: query.categoryId,
    condition: query.condition,
    isActive: query.isActive,
    availableOnly: query.availableOnly,
  }
  const [items, total] = await Promise.all([
    itemRepository.findMany({
      ...filters,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      sortBy,
      sortOrder: query.sortOrder,
    }),
    itemRepository.count(filters),
  ])

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  }
}

export function getItem(id: string) {
  return requireItem(id)
}

export async function createItem(
  input: CreateItemInput,
  auditContext: ItemAuditContext,
) {
  await requireActiveCategory(input.categoryId)

  const data: itemRepository.CreateItemData = {
    itemCode: generateItemCode(),
    itemName: input.itemName.trim(),
    description: normalizeNullableString(input.description) ?? null,
    categoryId: input.categoryId,
    totalQuantity: input.totalQuantity,
    availableQuantity: input.totalQuantity,
    condition: input.condition,
    storageLocation: input.storageLocation.trim(),
    googleDriveFolderLink:
      normalizeNullableString(input.googleDriveFolderLink) ?? null,
    createdBy: auditContext.userId,
  }

  try {
    return await itemRepository.transaction(async (transaction) => {
      const item = await itemRepository.create(data, transaction)

      await auditRepository.create(
        {
          userId: auditContext.userId,
          action: "ITEM_CREATED",
          entityType: "Item",
          entityId: item.id,
          description: `Item "${item.itemCode}" was created.`,
          newValues: toAuditValues(item),
          ipAddress: auditContext.ipAddress,
        },
        transaction,
      )

      return item
    })
  } catch (error: unknown) {
    return handleUniqueConstraint(error)
  }
}

export async function updateItem(
  id: string,
  input: UpdateItemInput,
  auditContext: ItemAuditContext,
) {
  const existingItem = await requireItem(id)
  const data: itemRepository.UpdateItemData = {
    updatedBy: auditContext.userId,
  }

  if (input.itemName !== undefined) {
    data.itemName = input.itemName.trim()
  }

  if (input.description !== undefined) {
    data.description = normalizeNullableString(input.description) ?? null
  }

  if (input.categoryId !== undefined) {
    await requireActiveCategory(input.categoryId)
    data.categoryId = input.categoryId
  }

  if (input.totalQuantity !== undefined) {
    const borrowedQuantity = getBorrowedQuantity(existingItem)

    if (input.totalQuantity < borrowedQuantity) {
      throw new AppError(
        409,
        "Total quantity cannot be less than the number of borrowed units.",
      )
    }

    data.totalQuantity = input.totalQuantity
    data.availableQuantity = input.totalQuantity - borrowedQuantity
  }

  if (input.condition !== undefined) {
    data.condition = input.condition
  }

  if (input.storageLocation !== undefined) {
    data.storageLocation = input.storageLocation.trim()
  }

  if (input.googleDriveFolderLink !== undefined) {
    data.googleDriveFolderLink =
      normalizeNullableString(input.googleDriveFolderLink) ?? null
  }

  if (input.isActive !== undefined) {
    if (!input.isActive && !existingItem.isActive) {
      throw new AppError(409, "Item is already inactive.")
    }

    if (input.isActive && !existingItem.isActive) {
      await requireActiveCategory(
        input.categoryId ?? existingItem.categoryId,
      )
    }

    data.isActive = input.isActive
  }

  try {
    return await itemRepository.transaction(async (transaction) => {
      if (existingItem.isActive && data.isActive === false) {
        await assertSafeToDeactivate(existingItem, transaction)
      }

      const item = await itemRepository.update(id, data, transaction)
      const action = getAuditAction(existingItem, item)

      await auditRepository.create(
        {
          userId: auditContext.userId,
          action,
          entityType: "Item",
          entityId: item.id,
          description: `Item "${item.itemCode}" was ${getAuditVerb(action)}.`,
          oldValues: toAuditValues(existingItem),
          newValues: toAuditValues(item),
          ipAddress: auditContext.ipAddress,
        },
        transaction,
      )

      return item
    })
  } catch (error: unknown) {
    return handleUniqueConstraint(error)
  }
}

export async function deactivateItem(
  id: string,
  auditContext: ItemAuditContext,
) {
  const existingItem = await requireItem(id)

  if (!existingItem.isActive) {
    throw new AppError(409, "Item is already inactive.")
  }

  return itemRepository.transaction(async (transaction) => {
    await assertSafeToDeactivate(existingItem, transaction)

    const item = await itemRepository.deactivate(
      id,
      auditContext.userId,
      transaction,
    )

    await auditRepository.create(
      {
        userId: auditContext.userId,
        action: "ITEM_DEACTIVATED",
        entityType: "Item",
        entityId: item.id,
        description: `Item "${item.itemCode}" was deactivated.`,
        oldValues: toAuditValues(existingItem),
        newValues: toAuditValues(item),
        ipAddress: auditContext.ipAddress,
      },
      transaction,
    )

    return item
  })
}
