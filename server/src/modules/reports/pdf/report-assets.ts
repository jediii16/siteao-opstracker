import { readFile } from "node:fs/promises"

const INVENTORY_REPORT_ASSETS = {
  header: "inventory-header.png",
  footer: "inventory-footer.png",
} as const

async function readPngAsDataUrl(fileName: string): Promise<string> {
  const assetUrl = new URL(`../assets/${fileName}`, import.meta.url)

  try {
    const file = await readFile(assetUrl)
    return `data:image/png;base64,${file.toString("base64")}`
  } catch {
    throw new Error(
      `Required inventory report branding asset "${fileName}" is unavailable.`,
    )
  }
}

export async function loadInventoryReportAssets() {
  const [headerDataUrl, footerDataUrl] = await Promise.all([
    readPngAsDataUrl(INVENTORY_REPORT_ASSETS.header),
    readPngAsDataUrl(INVENTORY_REPORT_ASSETS.footer),
  ])

  return {
    headerDataUrl,
    footerDataUrl,
  }
}
