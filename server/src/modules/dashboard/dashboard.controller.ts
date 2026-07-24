import type { Request, Response } from "express"

import { AppError } from "../../utils/AppError.js"
import * as dashboardService from "./dashboard.service.js"
import type { DashboardQueryInput } from "./dashboard.validation.js"

export async function getDashboard(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.user) {
    throw new AppError(401, "Authentication is required.")
  }

  const query = request.query as unknown as DashboardQueryInput
  const dashboard = await dashboardService.getDashboard(query, {
    userId: request.user.sub,
    role: request.user.role,
    committeeId: request.user.committeeId,
  })

  response.status(200).json({
    success: true,
    data: dashboard,
  })
}
