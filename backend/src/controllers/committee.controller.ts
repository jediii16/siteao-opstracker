import type { Request, Response } from "express"

import * as committeeService from "../services/committee.service.js"
import { AppError } from "../utils/AppError.js"
import type {
  CreateCommitteeInput,
  UpdateCommitteeInput,
} from "../validators/committee.validation.js"

function getAuditContext(request: Request) {
  if (!request.user) {
    throw new AppError(401, "Authentication is required.")
  }

  return {
    userId: request.user.sub,
    ipAddress: request.ip,
  }
}

function getCommitteeId(request: Request): string {
  const id = request.params.id

  if (typeof id !== "string") {
    throw new AppError(400, "Committee ID is required.")
  }

  return id
}

export async function getCommittees(
  _request: Request,
  response: Response,
): Promise<void> {
  const committees = await committeeService.getCommittees()

  response.status(200).json({
    success: true,
    data: { committees },
  })
}

export async function getCommittee(
  request: Request,
  response: Response,
): Promise<void> {
  const committee = await committeeService.getCommittee(
    getCommitteeId(request),
  )

  response.status(200).json({
    success: true,
    data: { committee },
  })
}

export async function createCommittee(
  request: Request,
  response: Response,
): Promise<void> {
  const input: CreateCommitteeInput = request.body
  const committee = await committeeService.createCommittee(
    input,
    getAuditContext(request),
  )

  response.status(201).json({
    success: true,
    message: "Committee created successfully.",
    data: { committee },
  })
}

export async function updateCommittee(
  request: Request,
  response: Response,
): Promise<void> {
  const input: UpdateCommitteeInput = request.body
  const committee = await committeeService.updateCommittee(
    getCommitteeId(request),
    input,
    getAuditContext(request),
  )

  response.status(200).json({
    success: true,
    message: "Committee updated successfully.",
    data: { committee },
  })
}

export async function deactivateCommittee(
  request: Request,
  response: Response,
): Promise<void> {
  const committee = await committeeService.deactivateCommittee(
    getCommitteeId(request),
    getAuditContext(request),
  )

  response.status(200).json({
    success: true,
    message: "Committee deactivated successfully.",
    data: { committee },
  })
}
