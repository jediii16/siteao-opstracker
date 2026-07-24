import { api } from '@/services/api'
import type { ApiEnvelope } from '@/types/api'
import type {
  InventoryReportDownload,
  InventoryReportFilters,
  InventoryReportPreviewParams,
  InventoryReportResponse,
} from '@/types/inventoryReport'

function cleanFilters(params: InventoryReportFilters) {
  const search = params.search?.trim()

  return {
    search: search || undefined,
    categoryId: params.categoryId || undefined,
    condition: params.condition || undefined,
    isActive: params.isActive,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  }
}

async function downloadInventoryReport(
  format: 'pdf' | 'csv',
  params: InventoryReportFilters,
): Promise<InventoryReportDownload> {
  const response = await api.get<Blob>('/reports/inventory', {
    params: {
      format,
      ...cleanFilters(params),
    },
    responseType: 'blob',
  })

  return {
    blob: response.data,
    contentDisposition: response.headers['content-disposition'],
  }
}

export const inventoryReportService = {
  async get(params: InventoryReportPreviewParams, signal?: AbortSignal) {
    const response = await api.get<ApiEnvelope<InventoryReportResponse>>('/reports/inventory', {
      params: {
        format: 'json',
        ...cleanFilters(params),
        page: params.page,
        limit: params.limit,
      },
      signal,
    })

    return response.data.data
  },

  downloadPdf(params: InventoryReportFilters) {
    return downloadInventoryReport('pdf', params)
  },

  downloadCsv(params: InventoryReportFilters) {
    return downloadInventoryReport('csv', params)
  },
}
