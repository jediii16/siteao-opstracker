import { api } from '@/services/api'
import type { ApiEnvelope, Committee } from '@/types/api'

export interface CommitteeInput {
  name: string
  description?: string | null
}

export const committeeService = {
  async list(signal?: AbortSignal) {
    const response = await api.get<ApiEnvelope<{ committees: Committee[] }>>('/committees', {
      signal,
    })
    return response.data.data.committees
  },

  async create(input: CommitteeInput) {
    const response = await api.post<ApiEnvelope<{ committee: Committee }>>('/committees', input)
    return response.data
  },

  async update(id: string, input: Partial<CommitteeInput> & { isActive?: boolean }) {
    const response = await api.patch<ApiEnvelope<{ committee: Committee }>>(
      `/committees/${id}`,
      input,
    )
    return response.data
  },

  async deactivate(id: string) {
    const response = await api.delete<ApiEnvelope<{ committee: Committee }>>(`/committees/${id}`)
    return response.data
  },
}
