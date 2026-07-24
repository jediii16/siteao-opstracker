import { api } from '@/services/api'
import type { ApiEnvelope, Category } from '@/types/api'

export interface CategoryInput {
  name: string
  description?: string | null
}

export const categoryService = {
  async list(isActive?: boolean, signal?: AbortSignal) {
    const response = await api.get<ApiEnvelope<{ categories: Category[] }>>('/categories', {
      params: isActive === undefined ? undefined : { isActive },
      signal,
    })
    return response.data.data.categories
  },

  async create(input: CategoryInput) {
    const response = await api.post<ApiEnvelope<{ category: Category }>>('/categories', input)
    return response.data
  },

  async update(id: string, input: Partial<CategoryInput> & { isActive?: boolean }) {
    const response = await api.patch<ApiEnvelope<{ category: Category }>>(
      `/categories/${id}`,
      input,
    )
    return response.data
  },

  async deactivate(id: string) {
    const response = await api.delete<ApiEnvelope<{ category: Category }>>(`/categories/${id}`)
    return response.data
  },
}
