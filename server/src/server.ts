import "dotenv/config"

import app from "./app.js"
import { env } from "./config/env.js"
import { closePdfBrowser } from "./modules/reports/pdf/pdf-browser.js"

const server = app.listen(env.PORT, () => {
  console.log(
    `SITEAO OpsTracker API running at http://localhost:${env.PORT}`,
  )
})

let isShuttingDown = false

function shutdown(signal: string): void {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  console.log(`${signal} received. Shutting down server...`)

  server.close(async (error) => {
    if (error) {
      console.error("Error while shutting down the server:", error)
      process.exit(1)
    }

    await closePdfBrowser().catch((browserError: unknown) => {
      console.error("Failed to close the PDF browser.", browserError)
    })

    console.log("Server closed successfully.")
    process.exit(0)
  })
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
