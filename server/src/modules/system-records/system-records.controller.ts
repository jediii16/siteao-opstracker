import type { Request, Response } from "express"

import { AppError } from "../../utils/AppError.js"
import * as systemRecordsService from "./system-records.service.js"
import type {
  AuditLogsQuery,
  InventoryTransactionsQuery,
} from "./system-records.validation.js"

function authenticatedRole(request: Request) {
  if (!request.user) {
    throw new AppError(401, "Authentication is required.")
  }

  return { role: request.user.role }
}

export async function getInventoryTransactions(
  request: Request,
  response: Response,
): Promise<void> {
  const data = await systemRecordsService.getInventoryTransactions(
    request.query as unknown as InventoryTransactionsQuery,
    authenticatedRole(request),
  )

  response.status(200).json({ success: true, data })
}

export async function getAuditLogs(
  request: Request,
  response: Response,
): Promise<void> {
  const data = await systemRecordsService.getAuditLogs(
    request.query as unknown as AuditLogsQuery,
    authenticatedRole(request),
  )

  response.status(200).json({ success: true, data })
}
