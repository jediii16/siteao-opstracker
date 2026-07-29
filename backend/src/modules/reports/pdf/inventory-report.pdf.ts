import type { InventoryReportDataset } from "../reports.types.js"
import { withPdfPage } from "./pdf-browser.js"
import { loadInventoryReportAssets } from "./report-assets.js"
import {
  createInventoryReportHtml,
  createInventoryReportFooterTemplate,
  createInventoryReportHeaderTemplate,
} from "./templates/inventory-report.template.js"

export async function createInventoryReportPdf(
  dataset: InventoryReportDataset,
): Promise<Buffer> {
  const [html, assets] = await Promise.all([
    Promise.resolve(createInventoryReportHtml(dataset)),
    loadInventoryReportAssets(),
  ])

  return withPdfPage(async (page) => {
    await page.setContent(html, {
      waitUntil: "load",
    })
    await page.emulateMediaType("print")

    const pdf = await page.pdf({
      format: "A4",
      landscape: false,
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: createInventoryReportHeaderTemplate(
        assets.headerDataUrl,
      ),
      footerTemplate: createInventoryReportFooterTemplate(
        assets.footerDataUrl,
      ),
      margin: {
        top: "32mm",
        right: "14mm",
        bottom: "20mm",
        left: "14mm",
      },
    })

    return Buffer.from(pdf)
  })
}
