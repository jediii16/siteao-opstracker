import {
  ItemCondition,
  UserRole,
} from "../../generated/prisma/enums.js"
import { AppError } from "../../utils/AppError.js"
import { createInventoryReportCsv } from "./csv/inventory-report.csv.js"
import { createInventoryReportPdf } from "./pdf/inventory-report.pdf.js"
import { inventoryReportConfig } from "./reports.config.js"
import * as reportsRepository from "./reports.repository.js"
import type {
  InventoryReportActor,
  InventoryReportDataset,
  InventoryReportItemDto,
  InventoryReportMetadata,
  InventoryReportQuery,
  InventoryReportResult,
  InventoryReportSummary,
} from "./reports.types.js"

const CONDITION_LABELS: Record<ItemCondition, string> = {
  [ItemCondition.GOOD]: "Good",
  [ItemCondition.FAIR]: "Fair",
  [ItemCondition.DAMAGED]: "Damaged",
  [ItemCondition.UNDER_REPAIR]: "Under Repair",
  [ItemCondition.LOST]: "Lost",
}

function dateParts(now: Date) {
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, "0")
  const day = String(now.getUTCDate()).padStart(2, "0")

  return {
    isoDate: `${year}-${month}-${day}`,
    readableDate: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(now),
  }
}

function createMetadata(now: Date): InventoryReportMetadata {
  return {
    title: "INVENTORY REPORT",
    dateOfInventory: dateParts(now).readableDate,
    conductedBy: inventoryReportConfig.conductedBy,
    preparedBy: inventoryReportConfig.preparedBy.name,
    notedBy: inventoryReportConfig.notedBy.title,
  }
}

function mapItem(
  item: Awaited<
    ReturnType<typeof reportsRepository.findInventoryReportItems>
  >[number],
): InventoryReportItemDto {
  return {
    id: item.id,
    itemCode: item.itemCode,
    itemName: item.itemName,
    condition: item.condition,
    conditionLabel: CONDITION_LABELS[item.condition],
    quantity: item.totalQuantity,
    availableQuantity: item.availableQuantity,
    borrowedQuantity: Math.max(
      0,
      item.totalQuantity - item.availableQuantity,
    ),
    category: item.category,
    storageLocation: item.storageLocation,
    isActive: item.isActive,
  }
}

function mapSummary(
  aggregate: Awaited<
    ReturnType<
      typeof reportsRepository.aggregateInventoryReportSummary
    >
  >,
): InventoryReportSummary {
  const totalQuantity = aggregate._sum.totalQuantity ?? 0
  const availableQuantity =
    aggregate._sum.availableQuantity ?? 0

  return {
    distinctItems: aggregate._count.id,
    totalQuantity,
    availableQuantity,
    borrowedQuantity: Math.max(
      0,
      totalQuantity - availableQuantity,
    ),
  }
}

async function requireReportActor(actor: InventoryReportActor) {
  const user = await reportsRepository.findInventoryReportActor(
    actor.userId,
  )

  if (!user) {
    throw new AppError(401, "Authenticated user no longer exists.")
  }

  if (!user.isActive || user.role !== actor.role) {
    throw new AppError(403, "Inventory report access is not authorized.")
  }

  if (actor.role === UserRole.SUPER_ADMIN) {
    return user
  }

  if (
    actor.role !== UserRole.COMMITTEE ||
    !actor.committeeId ||
    !user.committeeId ||
    actor.committeeId !== user.committeeId
  ) {
    throw new AppError(
      403,
      "Committee membership is required to access inventory reports.",
    )
  }

  return user
}

export async function generateInventoryReport(
  query: InventoryReportQuery,
  actor: InventoryReportActor,
): Promise<InventoryReportResult> {
  await requireReportActor(actor)

  if (
    actor.role === UserRole.COMMITTEE &&
    query.format === "csv"
  ) {
    throw new AppError(
      403,
      "CSV inventory export is restricted to super administrators.",
    )
  }

  if (
    actor.role === UserRole.COMMITTEE &&
    query.isActive === false
  ) {
    throw new AppError(
      403,
      "Committee users may only report active inventory items.",
    )
  }

  if (query.categoryId) {
    const category = await reportsRepository.findCategoryById(
      query.categoryId,
    )

    if (!category) {
      throw new AppError(404, "Category not found.")
    }
  }

  const filters: reportsRepository.InventoryReportFilters = {
    search: query.search,
    categoryId: query.categoryId,
    condition: query.condition,
    isActive: query.isActive,
  }
  const isJson = query.format === "json"
  const [items, aggregate] = await Promise.all([
    reportsRepository.findInventoryReportItems({
      ...filters,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      skip: isJson ? (query.page - 1) * query.limit : undefined,
      take: isJson ? query.limit : undefined,
    }),
    reportsRepository.aggregateInventoryReportSummary(filters),
  ])
  const now = new Date()
  const dataset: InventoryReportDataset = {
    report: createMetadata(now),
    summary: mapSummary(aggregate),
    items: items.map(mapItem),
    generatedAt: now.toISOString(),
  }

  if (query.format === "json") {
    return {
      format: "json",
      data: {
        ...dataset,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: dataset.summary.distinctItems,
          totalPages: Math.ceil(
            dataset.summary.distinctItems / query.limit,
          ),
        },
      },
    }
  }

  const filenameDate = dateParts(now).isoDate

  if (query.format === "csv") {
    return {
      format: "csv",
      filename: `siteao-inventory-report-${filenameDate}.csv`,
      content: createInventoryReportCsv(dataset),
    }
  }

  try {
    return {
      format: "pdf",
      filename: `siteao-inventory-report-${filenameDate}.pdf`,
      content: await createInventoryReportPdf(dataset),
    }
  } catch (error: unknown) {
    console.error(
      error instanceof Error
        ? `Inventory report PDF generation failed: ${error.message}`
        : "Inventory report PDF generation failed.",
    )
    throw new AppError(
      500,
      "Unable to generate the inventory PDF report.",
    )
  }
}
