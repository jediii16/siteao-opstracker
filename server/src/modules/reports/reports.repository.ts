import { prisma } from "../../config/prisma.js"
import type {
  ItemCondition,
  Prisma,
} from "../../generated/prisma/client.js"
import type { InventoryReportSortField } from "./reports.types.js"

export interface InventoryReportFilters {
  search?: string
  categoryId?: string
  condition?: ItemCondition
  isActive: boolean
}

export interface FindInventoryReportItemsOptions
  extends InventoryReportFilters {
  sortBy: InventoryReportSortField
  sortOrder: "asc" | "desc"
  skip?: number
  take?: number
}

const inventoryReportItemSelect = {
  id: true,
  itemCode: true,
  itemName: true,
  condition: true,
  totalQuantity: true,
  availableQuantity: true,
  storageLocation: true,
  isActive: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ItemSelect

function buildInventoryReportWhere(
  filters: InventoryReportFilters,
): Prisma.ItemWhereInput {
  const where: Prisma.ItemWhereInput = {
    isActive: filters.isActive,
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId
  }

  if (filters.condition) {
    where.condition = filters.condition
  }

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

  return where
}

export function findInventoryReportActor(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      committeeId: true,
    },
  })
}

export function findInventoryReportItems(
  options: FindInventoryReportItemsOptions,
) {
  const orderBy: Prisma.ItemOrderByWithRelationInput = {
    [options.sortBy]: options.sortOrder,
  }

  return prisma.item.findMany({
    where: buildInventoryReportWhere(options),
    select: inventoryReportItemSelect,
    orderBy,
    skip: options.skip,
    take: options.take,
  })
}

export function aggregateInventoryReportSummary(
  filters: InventoryReportFilters,
) {
  return prisma.item.aggregate({
    where: buildInventoryReportWhere(filters),
    _count: { id: true },
    _sum: {
      totalQuantity: true,
      availableQuantity: true,
    },
  })
}

export function findCategoryById(categoryId: string) {
  return prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      isActive: true,
    },
  })
}
