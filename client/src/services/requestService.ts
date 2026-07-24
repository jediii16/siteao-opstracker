import { api } from '@/services/api'
import type {
  ApiEnvelope,
  BorrowingHistoryRecord,
  BorrowingRequestDetails,
  BorrowingRequestSummary,
  Pagination,
  RequestStatus,
  ReturnCondition,
  SortOrder,
} from '@/types/api'

export interface RequestListParams {
  status?: RequestStatus
  committeeId?: string
  search?: string
  page: number
  limit: number
  sortBy: 'createdAt' | 'updatedAt' | 'borrowDate' | 'expectedReturnDate' | 'status'
  sortOrder: SortOrder
}

export interface HistoryListParams {
  status?: RequestStatus
  committeeId?: string
  itemId?: string
  search?: string
  page: number
  limit: number
  sortBy:
    | 'createdAt'
    | 'updatedAt'
    | 'borrowDate'
    | 'expectedReturnDate'
    | 'returnedAt'
    | 'status'
  sortOrder: SortOrder
}

export interface BorrowRequestInput {
  requesterName: string
  requesterPosition: string
  purpose: string
  borrowDate: string
  expectedReturnDate: string
  additionalNotes?: string | null
  items: Array<{
    itemId: string
    quantity: number
  }>
}

export const requestService = {
  async list(params: RequestListParams, committeeUser: boolean, signal?: AbortSignal) {
    const endpoint = committeeUser ? '/borrowing-requests/my' : '/borrowing-requests'
    const response = await api.get<
      ApiEnvelope<{ requests: BorrowingRequestSummary[]; pagination: Pagination }>
    >(endpoint, { params, signal })
    return response.data.data
  },

  async history(params: HistoryListParams, signal?: AbortSignal) {
    const response = await api.get<
      ApiEnvelope<{ history: BorrowingHistoryRecord[]; pagination: Pagination }>
    >('/borrowing-requests/history', { params, signal })
    return response.data.data
  },

  async get(id: string, signal?: AbortSignal) {
    const response = await api.get<ApiEnvelope<{ request: BorrowingRequestDetails }>>(
      `/borrowing-requests/${id}`,
      { signal },
    )
    return response.data.data.request
  },

  async create(input: BorrowRequestInput) {
    const response = await api.post<ApiEnvelope<{ request: BorrowingRequestDetails }>>(
      '/borrowing-requests',
      input,
    )
    return response.data
  },

  async approve(id: string, remarks?: string) {
    const response = await api.patch<ApiEnvelope<{ request: BorrowingRequestDetails }>>(
      `/borrowing-requests/${id}/approve`,
      remarks?.trim() ? { remarks: remarks.trim() } : {},
    )
    return response.data
  },

  async reject(id: string, reason: string) {
    const response = await api.patch<ApiEnvelope<{ request: BorrowingRequestDetails }>>(
      `/borrowing-requests/${id}/reject`,
      { reason },
    )
    return response.data
  },

  async processReturn(id: string, condition: ReturnCondition, notes?: string) {
    const response = await api.patch<ApiEnvelope<{ request: BorrowingRequestDetails }>>(
      `/borrowing-requests/${id}/return`,
      {
        condition,
        notes: notes?.trim() || null,
      },
    )
    return response.data
  },
}
