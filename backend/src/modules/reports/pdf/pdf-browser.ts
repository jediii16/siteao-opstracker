import puppeteer, {
  type Browser,
  type Page,
} from "puppeteer"

import { env } from "../../../config/env.js"

let browser: Browser | null = null
let browserLaunch: Promise<Browser> | null = null

async function launchBrowser(): Promise<Browser> {
  const launchedBrowser = await puppeteer.launch({
    headless: env.PUPPETEER_HEADLESS,
    executablePath: env.PUPPETEER_EXECUTABLE_PATH,
  })
  const initialPages = await launchedBrowser.pages()

  await Promise.all(
    initialPages.map((initialPage) =>
      initialPage.close().catch(() => undefined),
    ),
  )

  launchedBrowser.on("disconnected", () => {
    if (browser === launchedBrowser) {
      browser = null
    }
    browserLaunch = null
  })

  browser = launchedBrowser
  return launchedBrowser
}

async function getPdfBrowser(): Promise<Browser> {
  if (browser?.connected) {
    return browser
  }

  browserLaunch ??= launchBrowser()

  try {
    return await browserLaunch
  } catch (error: unknown) {
    browserLaunch = null
    throw error
  }
}

export async function withPdfPage<T>(
  operation: (page: Page) => Promise<T>,
): Promise<T> {
  const activeBrowser = await getPdfBrowser()
  const page = await activeBrowser.newPage()

  try {
    return await operation(page)
  } finally {
    await page.close().catch(() => undefined)
  }
}

export async function closePdfBrowser(): Promise<void> {
  const activeBrowser = browser ?? (await browserLaunch?.catch(() => null))

  browser = null
  browserLaunch = null

  if (activeBrowser?.connected) {
    await activeBrowser.close()
  }
}

export function isPdfBrowserConnected(): boolean {
  return browser?.connected ?? false
}

export async function getOpenPdfPageCount(): Promise<number> {
  return browser?.connected ? (await browser.pages()).length : 0
}
