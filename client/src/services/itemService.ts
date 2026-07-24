import { api } from '@/services/api'
import type {
  ApiEnvelope,
  InventoryItem,
  ItemBorrowingHistoryEntry,
  ItemCondition,
  Pagination,
  SortOrder,
} from '@/types/api'

export interface ItemListParams {
  search?: string
  categoryId?: string
  condition?: ItemCondition
  isActive?: boolean
  availableOnly?: boolean
  page: number
  limit: number
  sortBy: 'itemName' | 'itemCode' | 'totalQuantity' | 'availableQuantity' | 'createdAt' | 'updatedAt'
  sortOrder: SortOrder
}

export interface ItemInput {
  itemCode: string
  itemName: string
  description?: string | null
  categoryId: string
  totalQuantity: number
  condition: ItemCondition
  storageLocation: string
  googleDriveFolderLink?: string | null
}

export const itemService = {
  async list(params: ItemListParams, signal?: AbortSignal) {
    const response = await api.get<ApiEnvelope<{ items: InventoryItem[]; pagination: Pagination }>>(
      '/items',
      { params, signal },
    )
    return response.data.data
  },

  async get(id: string, signal?: AbortSignal) {
    const response = await api.get<ApiEnvelope<{ item: InventoryItem }>>(`/items/${id}`, { signal })
    return response.data.data.item
  },

  async create(input: ItemInput) {
    const response = await api.post<ApiEnvelope<{ item: InventoryItem }>>('/items', input)
    return response.data
  },

  async update(id: string, input: Partial<ItemInput> & { isActive?: boolean }) {
    const response = await api.patch<ApiEnvelope<{ item: InventoryItem }>>(`/items/${id}`, input)
    return response.data
  },

  async deactivate(id: string) {
    const response = await api.delete<ApiEnvelope<{ item: InventoryItem }>>(`/items/${id}`)
    return response.data
  },

  async history(id: string, page: number, limit: number, signal?: AbortSignal) {
    const response = await api.get<
      ApiEnvelope<{
        item: Pick<
          InventoryItem,
          'id' | 'itemCode' | 'itemName' | 'description' | 'condition' | 'isActive' | 'category'
        >
        history: ItemBorrowingHistoryEntry[]
        pagination: Pagination
      }>
    >(`/items/${id}/history`, {
      params: { page, limit },
      signal,
    })
    return response.data.data
  },
}
