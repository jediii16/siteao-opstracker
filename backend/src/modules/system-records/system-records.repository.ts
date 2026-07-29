import { prisma } from "../../config/prisma.js"
import type {
  Prisma,
  TransactionType,
} from "../../generated/prisma/client.js"

export interface InventoryTransactionFilters {
  search?: string
  transactionType?: TransactionType
  createdAt?: {
    gte?: Date
    lt?: Date
  }
}

export interface AuditLogFilters {
  search?: string
  action?: string
  entityType?: string
  createdAt?: {
    gte?: Date
    lt?: Date
  }
}

function inventoryTransactionWhere(
  filters: InventoryTransactionFilters,
): Prisma.InventoryTransactionWhereInput {
  return {
    transactionType: filters.transactionType,
    createdAt: filters.createdAt,
    OR: filters.search
      ? [
          {
            item: {
              itemCode: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
          {
            item: {
              itemName: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
          {
            borrowingRequest: {
              requestCode: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
          {
            performer: {
              username: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
          {
            remarks: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        ]
      : undefined,
  }
}

function auditLogWhere(
  filters: AuditLogFilters,
): Prisma.AuditLogWhereInput {
  return {
    action: filters.action,
    entityType: filters.entityType,
    createdAt: filters.createdAt,
    OR: filters.search
      ? [
          {
            action: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
          {
            entityType: {
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
            user: {
              username: {
                contains: filters.search,
                mode: "insensitive",
              },
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
            ipAddress: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        ]
      : undefined,
  }
}

export function findInventoryTransactions(options: {
  filters: InventoryTransactionFilters
  skip: number
  take: number
  sortBy: "createdAt" | "transactionType" | "quantity"
  sortOrder: "asc" | "desc"
}) {
  return prisma.inventoryTransaction.findMany({
    where: inventoryTransactionWhere(options.filters),
    select: {
      id: true,
      transactionType: true,
      quantity: true,
      quantityBefore: true,
      quantityAfter: true,
      remarks: true,
      createdAt: true,
      item: {
        select: {
          id: true,
          itemCode: true,
          itemName: true,
        },
      },
      borrowingRequest: {
        select: {
          id: true,
          requestCode: true,
        },
      },
      performer: {
        select: {
          id: true,
          username: true,
        },
      },
    },
    orderBy: [
      { [options.sortBy]: options.sortOrder },
      { id: options.sortOrder },
    ],
    skip: options.skip,
    take: options.take,
  })
}

export function countInventoryTransactions(
  filters: InventoryTransactionFilters,
) {
  return prisma.inventoryTransaction.count({
    where: inventoryTransactionWhere(filters),
  })
}

export function findAuditLogs(options: {
  filters: AuditLogFilters
  skip: number
  take: number
  sortBy: "createdAt" | "action" | "entityType"
  sortOrder: "asc" | "desc"
}) {
  return prisma.auditLog.findMany({
    where: auditLogWhere(options.filters),
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      description: true,
      oldValues: true,
      newValues: true,
      ipAddress: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          username: true,
        },
      },
      committee: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { [options.sortBy]: options.sortOrder },
      { id: options.sortOrder },
    ],
    skip: options.skip,
    take: options.take,
  })
}

export function countAuditLogs(filters: AuditLogFilters) {
  return prisma.auditLog.count({
    where: auditLogWhere(filters),
  })
}

export async function getAuditLogFacets() {
  const [actions, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
    prisma.auditLog.findMany({
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
    }),
  ])

  return {
    actions: actions.map((entry) => entry.action),
    entityTypes: entityTypes.map((entry) => entry.entityType),
  }
}
