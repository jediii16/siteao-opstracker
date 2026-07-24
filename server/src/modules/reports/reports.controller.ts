import type { Request, Response } from "express"

import { AppError } from "../../utils/AppError.js"
import * as reportsService from "./reports.service.js"
import type { InventoryReportQueryInput } from "./reports.validation.js"

export async function getInventoryReport(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.user) {
    throw new AppError(401, "Authentication is required.")
  }

  const query = request.query as unknown as InventoryReportQueryInput
  const result = await reportsService.generateInventoryReport(query, {
    userId: request.user.sub,
    role: request.user.role,
    committeeId: request.user.committeeId,
  })

  if (result.format === "json") {
    response.status(200).json({
      success: true,
      data: result.data,
    })
    return
  }

  response
    .status(200)
    .set({
      "Content-Type":
        result.format === "csv"
          ? "text/csv; charset=utf-8"
          : "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "private, no-store",
    })
    .send(result.content)
}
