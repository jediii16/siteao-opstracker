import type { Request, Response } from "express"

import { AppError } from "../../utils/AppError.js"
import * as systemSettingsService from "./system-settings.service.js"
import type { UpdateSystemSettingsInput } from "./system-settings.validation.js"

function getAuditContext(request: Request) {
  if (!request.user) {
    throw new AppError(401, "Authentication is required.")
  }

  return {
    userId: request.user.sub,
    ipAddress: request.ip,
  }
}

export async function getSystemSettings(
  _request: Request,
  response: Response,
): Promise<void> {
  const settings = await systemSettingsService.getSystemSettings()

  response.status(200).json({
    success: true,
    data: { settings },
  })
}

export async function updateSystemSettings(
  request: Request,
  response: Response,
): Promise<void> {
  const input: UpdateSystemSettingsInput = request.body
  const settings = await systemSettingsService.updateSystemSettings(
    input,
    getAuditContext(request),
  )

  response.status(200).json({
    success: true,
    message: "System settings updated successfully.",
    data: { settings },
  })
}
