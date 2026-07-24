import { prisma } from "../config/prisma.js"
import {
  RequestStatus,
  type ItemCondition,
  type Prisma,
} from "../generated/prisma/client.js"

const itemSelect = {
  id: true,
  itemCode: true,
  categoryId: true,
  itemName: true,
  description: true,
  totalQuantity: true,
  availableQuantity: true,
  condition: true,
  storageLocation: true,
  googleDriveFolderLink: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ItemSelect

type ItemClient = Pick<
  Prisma.TransactionClient,
  "item" | "category" | "borrowingRequestItem"
>

export type ItemSortField =
  | "itemName"
  | "itemCode"
  | "totalQuantity"
  | "availableQuantity"
  | "createdAt"
  | "updatedAt"

export interface ItemFilters {
  search?: string
  categoryId?: string
  condition?: ItemCondition
  isActive?: boolean
  availableOnly?: boolean
}

export interface FindManyItemsOptions extends ItemFilters {
  skip: number
  take: number
  sortBy: ItemSortField
  sortOrder: "asc" | "desc"
}

export interface CreateItemData {
  itemCode: string
  categoryId: string
  itemName: string
  description: string | null
  totalQuantity: number
  availableQuantity: number
  condition: ItemCondition
  storageLocation: string
  googleDriveFolderLink: string | null
  createdBy: string
}

export interface UpdateItemData {
  itemCode?: string
  categoryId?: string
  itemName?: string
  description?: string | null
  totalQuantity?: number
  availableQuantity?: number
  condition?: ItemCondition
  storageLocation?: string
  googleDriveFolderLink?: string | null
  isActive?: boolean
  updatedBy: string
}

function buildWhere(filters: ItemFilters): Prisma.ItemWhereInput {
  const where: Prisma.ItemWhereInput = {}

  if (filters.search) {
    where.OR = [
      {
        itemCode: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        itemName: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        storageLocation: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ]
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId
  }

  if (filters.condition) {
    where.condition = filters.condition
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  if (filters.availableOnly) {
    where.availableQuantity = { gt: 0 }
  }

  return where
}

export function findMany(options: FindManyItemsOptions) {
  const orderBy: Prisma.ItemOrderByWithRelationInput = {
    [options.sortBy]: options.sortOrder,
  }

  return prisma.item.findMany({
    where: buildWhere(options),
    select: itemSelect,
    orderBy,
    skip: options.skip,
    take: options.take,
  })
}

export function count(filters: ItemFilters) {
  return prisma.item.count({
    where: buildWhere(filters),
  })
}

export function findById(id: string) {
  return prisma.item.findUnique({
    where: { id },
    select: itemSelect,
  })
}

export function findByItemCode(itemCode: string) {
  return prisma.item.findFirst({
    where: {
      itemCode: {
        equals: itemCode,
        mode: "insensitive",
      },
    },
    select: itemSelect,
  })
}

export function findCategoryById(
  categoryId: string,
  client: ItemClient = prisma,
) {
  return client.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  })
}

export function create(
  data: CreateItemData,
  client: ItemClient = prisma,
) {
  return client.item.create({
    data,
    select: itemSelect,
  })
}

export function update(
  id: string,
  data: UpdateItemData,
  client: ItemClient = prisma,
) {
  return client.item.update({
    where: { id },
    data,
    select: itemSelect,
  })
}

export function deactivate(
  id: string,
  updatedBy: string,
  client: ItemClient = prisma,
) {
  return client.item.update({
    where: { id },
    data: {
      isActive: false,
      updatedBy,
    },
    select: itemSelect,
  })
}

export function countActiveBorrowingRecords(
  itemId: string,
  client: ItemClient = prisma,
) {
  return client.borrowingRequestItem.count({
    where: {
      itemId,
      borrowingRequest: {
        status: {
          in: [
            RequestStatus.PENDING,
            RequestStatus.APPROVED,
            RequestStatus.BORROWED,
          ],
        },
      },
    },
  })
}

export function transaction<T>(
  operation: (client: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(operation)
}
