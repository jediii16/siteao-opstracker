import { api } from '@/services/api'
import type {
  ApiEnvelope,
  AuditLogRecord,
  InventoryTransactionRecord,
  Pagination,
  SortOrder,
  TransactionType,
} from '@/types/api'

export interface InventoryTransactionListParams {
  search?: string
  transactionType?: TransactionType
  dateFrom?: string
  dateTo?: string
  page: number
  limit: number
  sortBy: 'createdAt' | 'transactionType' | 'quantity'
  sortOrder: SortOrder
}

export interface AuditLogListParams {
  search?: string
  action?: string
  entityType?: string
  dateFrom?: string
  dateTo?: string
  page: number
  limit: number
  sortBy: 'createdAt' | 'action' | 'entityType'
  sortOrder: SortOrder
}

export const systemRecordsService = {
  async inventoryTransactions(
    params: InventoryTransactionListParams,
    signal?: AbortSignal,
  ) {
    const response = await api.get<
      ApiEnvelope<{
        transactions: InventoryTransactionRecord[]
        pagination: Pagination
      }>
    >('/inventory-transactions', { params, signal })

    return response.data.data
  },

  async auditLogs(params: AuditLogListParams, signal?: AbortSignal) {
    const response = await api.get<
      ApiEnvelope<{
        logs: AuditLogRecord[]
        pagination: Pagination
        filters: {
          actions: string[]
          entityTypes: string[]
        }
      }>
    >('/audit-logs', { params, signal })

    return response.data.data
  },
}
