import { api } from '@/services/api'
import type { ApiEnvelope, SystemSettings } from '@/types/api'

export interface SystemSettingsInput {
  siteaoGovernorName: string
}

export const systemSettingsService = {
  async get(signal?: AbortSignal) {
    const response = await api.get<ApiEnvelope<{ settings: SystemSettings }>>(
      '/system-settings',
      { signal },
    )
    return response.data.data.settings
  },

  async update(input: SystemSettingsInput) {
    const response = await api.patch<ApiEnvelope<{ settings: SystemSettings }>>(
      '/system-settings',
      input,
    )
    return response.data
  },
}
