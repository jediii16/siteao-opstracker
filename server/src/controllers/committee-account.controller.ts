import type { Request, Response } from "express"

import * as committeeAccountService from "../services/committee-account.service.js"
import { AppError } from "../utils/AppError.js"
import type {
  CreateCommitteeAccountInput,
  ResetCommitteeAccountPasswordInput,
  UpdateCommitteeAccountInput,
  UpdateCommitteeAccountStatusInput,
} from "../validators/committee-account.validation.js"

function getAuditContext(request: Request) {
  if (!request.user) {
    throw new AppError(401, "Authentication is required.")
  }

  return {
    userId: request.user.sub,
    ipAddress: request.ip,
  }
}

function getAccountId(request: Request): string {
  const id = request.params.id

  if (typeof id !== "string") {
    throw new AppError(400, "User ID is required.")
  }

  return id
}

export async function getCommitteeAccounts(
  _request: Request,
  response: Response,
): Promise<void> {
  const users = await committeeAccountService.getCommitteeAccounts()

  response.status(200).json({
    success: true,
    data: { users },
  })
}

export async function createCommitteeAccount(
  request: Request,
  response: Response,
): Promise<void> {
  const input: CreateCommitteeAccountInput = request.body
  const user = await committeeAccountService.createCommitteeAccount(
    input,
    getAuditContext(request),
  )

  response.status(201).json({
    success: true,
    message: "Committee account created successfully.",
    data: { user },
  })
}

export async function updateCommitteeAccount(
  request: Request,
  response: Response,
): Promise<void> {
  const input: UpdateCommitteeAccountInput = request.body
  const user = await committeeAccountService.updateCommitteeAccount(
    getAccountId(request),
    input,
    getAuditContext(request),
  )

  response.status(200).json({
    success: true,
    message: "Committee account updated successfully.",
    data: { user },
  })
}

export async function resetCommitteeAccountPassword(
  request: Request,
  response: Response,
): Promise<void> {
  const input: ResetCommitteeAccountPasswordInput = request.body

  await committeeAccountService.resetCommitteeAccountPassword(
    getAccountId(request),
    input,
    getAuditContext(request),
  )

  response.status(200).json({
    success: true,
    message: "Committee account password reset successfully.",
  })
}

export async function updateCommitteeAccountStatus(
  request: Request,
  response: Response,
): Promise<void> {
  const input: UpdateCommitteeAccountStatusInput = request.body
  const user = await committeeAccountService.updateCommitteeAccountStatus(
    getAccountId(request),
    input,
    getAuditContext(request),
  )

  response.status(200).json({
    success: true,
    message: `Committee account ${user.isActive ? "activated" : "deactivated"} successfully.`,
    data: { user },
  })
}
