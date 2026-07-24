import { inventoryReportConfig } from "../../reports.config.js"
import type { InventoryReportDataset } from "../../reports.types.js"

function escapeHtml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function createInventoryReportHtml(
  dataset: InventoryReportDataset,
): string {
  const rows =
    dataset.items.length === 0
      ? `
        <tr class="empty-row">
          <td colspan="3">No inventory items matched the selected filters.</td>
        </tr>
      `
      : dataset.items
          .map(
            (item) => `
              <tr>
                <td class="item-cell">${escapeHtml(item.itemName)}</td>
                <td class="condition-cell">${escapeHtml(item.conditionLabel)}</td>
                <td class="quantity-cell">${escapeHtml(item.quantity)}</td>
              </tr>
            `,
          )
          .join("")

  const preparedTitle = inventoryReportConfig.preparedBy.title
    ? `<div class="signature-title">${escapeHtml(inventoryReportConfig.preparedBy.title)}</div>`
    : ""
  const notedTitle = inventoryReportConfig.notedBy.title
    ? `<div class="signature-title">${escapeHtml(inventoryReportConfig.notedBy.title)}</div>`
    : ""

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${dataset.report.title}</title>
  <style>
    * {
      box-sizing: border-box;
    }

    @page {
      size: A4 portrait;
      margin: 32mm 14mm 20mm;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      color: #111111;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    main {
      width: 100%;
    }

    h1 {
      margin: 0 0 7mm;
      text-align: center;
      font-size: 17pt;
      letter-spacing: 1.1px;
      line-height: 1.1;
    }

    .metadata {
      width: 100%;
      margin-bottom: 5mm;
      border-collapse: collapse;
    }

    .metadata td {
      padding: 1.1mm 0;
      vertical-align: top;
    }

    .metadata .label {
      width: 42mm;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    .metadata .colon {
      width: 6mm;
      text-align: center;
      font-weight: 700;
    }

    .divider {
      height: 1mm;
      margin: 0 0 5mm;
      background: #111111;
    }

    .inventory-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .inventory-table thead {
      display: table-header-group;
    }

    .inventory-table tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .inventory-table th,
    .inventory-table td {
      border: 0.35mm solid #111111;
      padding: 3mm 2.4mm;
      vertical-align: middle;
    }

    .inventory-table th {
      background: #ededed;
      text-align: center;
      font-size: 9.5pt;
      font-weight: 800;
      letter-spacing: 0.35px;
    }

    .inventory-table .item-column {
      width: 35%;
    }

    .inventory-table .condition-column {
      width: 40%;
    }

    .inventory-table .quantity-column {
      width: 25%;
    }

    .item-cell {
      text-align: left;
      font-weight: 600;
    }

    .condition-cell,
    .quantity-cell,
    .empty-row td {
      text-align: center;
    }

    .empty-row td {
      height: 18mm;
      color: #666666;
      font-style: italic;
      font-weight: 400;
    }

    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22mm;
      margin-top: 16mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .signature-block {
      min-height: 36mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .signature-label {
      font-weight: 700;
    }

    .signature-identity {
      margin-top: 18mm;
      border-top: 0.3mm solid #111111;
      padding-top: 1.5mm;
      text-align: center;
    }

    .signature-name {
      font-size: 10pt;
      font-weight: 800;
      letter-spacing: 0.35px;
    }

    .signature-title {
      margin-top: 0.6mm;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <main>
    <h1>${dataset.report.title}</h1>

    <table class="metadata" aria-label="Report metadata">
      <tr>
        <td class="label">DATE OF INVENTORY</td>
        <td class="colon">:</td>
        <td>${escapeHtml(dataset.report.dateOfInventory)}</td>
      </tr>
      <tr>
        <td class="label">CONDUCTED BY</td>
        <td class="colon">:</td>
        <td>${escapeHtml(inventoryReportConfig.conductedBy)}</td>
      </tr>
    </table>

    <div class="divider"></div>

    <table class="inventory-table" aria-label="Inventory items">
      <thead>
        <tr>
          <th class="item-column">Item</th>
          <th class="condition-column">Condition</th>
          <th class="quantity-column">QTY</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <section class="signature-section">
      <div class="signature-block">
        <div class="signature-label">Prepared by:</div>
        <div class="signature-identity">
          <div class="signature-name">${escapeHtml(inventoryReportConfig.preparedBy.name)}</div>
          ${preparedTitle}
        </div>
      </div>
      <div class="signature-block">
        <div class="signature-label">Noted by:</div>
        <div class="signature-identity">
          <div class="signature-name">${escapeHtml(inventoryReportConfig.notedBy.name)}</div>
          ${notedTitle}
        </div>
      </div>
    </section>
  </main>
</body>
</html>`
}

export function createInventoryReportHeaderTemplate(
  headerDataUrl: string,
): string {
  return `
    <div style="
      width:100%;
      margin:0;
      padding:0;
      font-size:0;
      transform:translateY(-5.2mm);
    ">
      <img
        src="${headerDataUrl}"
        alt=""
        style="display:block;width:100%;height:auto;margin:0;padding:0;"
      >
    </div>
  `
}

export function createInventoryReportFooterTemplate(
  footerDataUrl: string,
): string {
  return `
    <div style="
      width:100%;
      margin:0;
      padding:0;
      font-size:0;
      transform:translateY(5.2mm);
    ">
      <img
        src="${footerDataUrl}"
        alt=""
        style="display:block;width:100%;height:auto;margin:0;padding:0;"
      >
    </div>
  `
}
