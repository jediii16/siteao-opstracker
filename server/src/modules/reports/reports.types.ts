import type {
  ItemCondition,
  UserRole,
} from "../../generated/prisma/enums.js"

export type InventoryReportFormat = "json" | "csv" | "pdf"

export type InventoryReportSortField =
  | "itemName"
  | "itemCode"
  | "condition"
  | "totalQuantity"
  | "availableQuantity"
  | "createdAt"
  | "updatedAt"

export interface InventoryReportQuery {
  format: InventoryReportFormat
  search?: string
  categoryId?: string
  condition?: ItemCondition
  isActive: boolean
  page: number
  limit: number
  sortBy: InventoryReportSortField
  sortOrder: "asc" | "desc"
}

export interface InventoryReportActor {
  userId: string
  role: UserRole
  committeeId: string | null
}

export interface InventoryReportMetadata {
  title: "INVENTORY REPORT"
  dateOfInventory: string
  conductedBy: "Logistics Team"
  preparedBy: "Logistics Team"
  notedBy: {
    name: string
    title: "SITEAO Governor"
  }
}

export interface InventoryReportSummary {
  distinctItems: number
  totalQuantity: number
  availableQuantity: number
  borrowedQuantity: number
}

export interface InventoryReportItemDto {
  id: string
  itemCode: string
  itemName: string
  condition: ItemCondition
  conditionLabel: string
  quantity: number
  availableQuantity: number
  borrowedQuantity: number
  category: {
    id: string
    name: string
  }
  storageLocation: string
  isActive: boolean
}

export interface InventoryReportDataset {
  report: InventoryReportMetadata
  summary: InventoryReportSummary
  items: InventoryReportItemDto[]
  generatedAt: string
}

export type InventoryReportResult =
  | {
      format: "json"
      data: InventoryReportDataset & {
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }
    }
  | {
      format: "csv"
      filename: string
      content: string
    }
  | {
      format: "pdf"
      filename: string
      content: Buffer
    }
