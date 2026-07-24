import type { InventoryReportDataset } from "../reports.types.js"

const CSV_HEADERS = [
  "Item Code",
  "Item",
  "Category",
  "Condition",
  "Total Quantity",
  "Available Quantity",
  "Borrowed Quantity",
  "Storage Location",
  "Status",
] as const

function escapeCsvValue(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return ""
  }

  const text = String(value)

  return /[",\r\n]/.test(text)
    ? `"${text.replaceAll('"', '""')}"`
    : text
}

function serializeCsvRow(
  values: readonly (string | number | null | undefined)[],
): string {
  return values.map(escapeCsvValue).join(",")
}

export function createInventoryReportCsv(
  dataset: InventoryReportDataset,
): string {
  const rows = dataset.items.map((item) =>
    serializeCsvRow([
      item.itemCode,
      item.itemName,
      item.category.name,
      item.conditionLabel,
      item.quantity,
      item.availableQuantity,
      item.borrowedQuantity,
      item.storageLocation,
      item.isActive ? "Active" : "Inactive",
    ]),
  )

  return `\uFEFF${[
    serializeCsvRow(CSV_HEADERS),
    ...rows,
  ].join("\r\n")}\r\n`
}

export { CSV_HEADERS }
