import { UserRole } from "../../generated/prisma/enums.js"
import { AppError } from "../../utils/AppError.js"
import * as systemRecordsRepository from "./system-records.repository.js"
import type {
  AuditLogsQuery,
  InventoryTransactionsQuery,
} from "./system-records.validation.js"

interface SystemRecordsActor {
  role: string
}

function requireSuperAdmin(actor: SystemRecordsActor) {
  if (actor.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, "SUPER_ADMIN access is required.")
  }
}

function addUtcDays(date: Date, days: number) {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function toDateRange(dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) {
    return undefined
  }

  return {
    gte: dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`) : undefined,
    lt: dateTo
      ? addUtcDays(new Date(`${dateTo}T00:00:00.000Z`), 1)
      : undefined,
  }
}

function pagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getInventoryTransactions(
  query: InventoryTransactionsQuery,
  actor: SystemRecordsActor,
) {
  requireSuperAdmin(actor)
  const filters: systemRecordsRepository.InventoryTransactionFilters = {
    search: query.search,
    transactionType: query.transactionType,
    createdAt: toDateRange(query.dateFrom, query.dateTo),
  }
  const [transactions, total] = await Promise.all([
    systemRecordsRepository.findInventoryTransactions({
      filters,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }),
    systemRecordsRepository.countInventoryTransactions(filters),
  ])

  return {
    transactions,
    pagination: pagination(query.page, query.limit, total),
  }
}

export async function getAuditLogs(
  query: AuditLogsQuery,
  actor: SystemRecordsActor,
) {
  requireSuperAdmin(actor)
  const filters: systemRecordsRepository.AuditLogFilters = {
    search: query.search,
    action: query.action,
    entityType: query.entityType,
    createdAt: toDateRange(query.dateFrom, query.dateTo),
  }
  const [logs, total, facets] = await Promise.all([
    systemRecordsRepository.findAuditLogs({
      filters,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }),
    systemRecordsRepository.countAuditLogs(filters),
    systemRecordsRepository.getAuditLogFacets(),
  ])

  return {
    logs,
    pagination: pagination(query.page, query.limit, total),
    filters: facets,
  }
}
