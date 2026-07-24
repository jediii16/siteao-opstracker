import { api } from '@/services/api'
import type { ApiEnvelope, CommitteeAccount } from '@/types/api'

export const committeeAccountService = {
  async list(signal?: AbortSignal) {
    const response = await api.get<ApiEnvelope<{ users: CommitteeAccount[] }>>(
      '/users/committee-accounts',
      { signal },
    )
    return response.data.data.users
  },

  async create(input: { username: string; password: string; committeeId: string }) {
    const response = await api.post<ApiEnvelope<{ user: CommitteeAccount }>>(
      '/users/committee-accounts',
      input,
    )
    return response.data
  },

  async update(id: string, username: string) {
    const response = await api.patch<ApiEnvelope<{ user: CommitteeAccount }>>(
      `/users/committee-accounts/${id}`,
      { username },
    )
    return response.data
  },

  async resetPassword(id: string, newPassword: string) {
    const response = await api.post<{ success: boolean; message?: string }>(
      `/users/committee-accounts/${id}/reset-password`,
      { newPassword },
    )
    return response.data
  },

  async updateStatus(id: string, isActive: boolean) {
    const response = await api.patch<ApiEnvelope<{ user: CommitteeAccount }>>(
      `/users/committee-accounts/${id}/status`,
      { isActive },
    )
    return response.data
  },
}
