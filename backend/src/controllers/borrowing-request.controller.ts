import type { Request, Response } from "express"

import * as borrowingRequestService from "../services/borrowing-request.service.js"
import { AppError } from "../utils/AppError.js"
import type {
  ApproveBorrowingRequestInput,
  BorrowingHistoryQuery,
  CreateBorrowingRequestInput,
  ListAllBorrowingRequestsQuery,
  ListMyBorrowingRequestsQuery,
  RejectBorrowingRequestInput,
  ReturnBorrowingRequestInput,
} from "../validators/borrowing-request.validation.js"

function getActorContext(request: Request) {
  if (!request.user) {
    throw new AppError(401, "Authentication is required.")
  }

  return {
    userId: request.user.sub,
    role: request.user.role,
    committeeId: request.user.committeeId,
    ipAddress: request.ip,
  }
}

function getRequestId(request: Request): string {
  const id = request.params.id

  if (typeof id !== "string") {
    throw new AppError(400, "Borrowing request ID is required.")
  }

  return id
}

export async function createBorrowingRequest(
  request: Request,
  response: Response,
): Promise<void> {
  const input: CreateBorrowingRequestInput = request.body
  const borrowingRequest =
    await borrowingRequestService.createBorrowingRequest(
      input,
      getActorContext(request),
    )

  response.status(201).json({
    success: true,
    message: "Borrowing request created successfully.",
    data: { request: borrowingRequest },
  })
}

export async function getMyBorrowingRequests(
  request: Request,
  response: Response,
): Promise<void> {
  const query =
    request.query as unknown as ListMyBorrowingRequestsQuery
  const result =
    await borrowingRequestService.getMyBorrowingRequests(
      query,
      getActorContext(request),
    )

  response.status(200).json({
    success: true,
    data: result,
  })
}

export async function getBorrowingRequest(
  request: Request,
  response: Response,
): Promise<void> {
  const borrowingRequest =
    await borrowingRequestService.getBorrowingRequest(
      getRequestId(request),
      getActorContext(request),
    )

  response.status(200).json({
    success: true,
    data: { request: borrowingRequest },
  })
}

export async function getAllBorrowingRequests(
  request: Request,
  response: Response,
): Promise<void> {
  const query =
    request.query as unknown as ListAllBorrowingRequestsQuery
  const result =
    await borrowingRequestService.getAllBorrowingRequests(
      query,
      getActorContext(request),
    )

  response.status(200).json({
    success: true,
    data: result,
  })
}

export async function getBorrowingHistory(
  request: Request,
  response: Response,
): Promise<void> {
  const query = request.query as unknown as BorrowingHistoryQuery
  const result = await borrowingRequestService.getBorrowingHistory(
    query,
    getActorContext(request),
  )

  response.status(200).json({
    success: true,
    data: result,
  })
}

export async function approveBorrowingRequest(
  request: Request,
  response: Response,
): Promise<void> {
  const input: ApproveBorrowingRequestInput = request.body
  const borrowingRequest =
    await borrowingRequestService.approveBorrowingRequest(
      getRequestId(request),
      input,
      getActorContext(request),
    )

  response.status(200).json({
    success: true,
    message: "Borrowing request approved successfully.",
    data: { request: borrowingRequest },
  })
}

export async function rejectBorrowingRequest(
  request: Request,
  response: Response,
): Promise<void> {
  const input: RejectBorrowingRequestInput = request.body
  const borrowingRequest =
    await borrowingRequestService.rejectBorrowingRequest(
      getRequestId(request),
      input,
      getActorContext(request),
    )

  response.status(200).json({
    success: true,
    message: "Borrowing request rejected successfully.",
    data: { request: borrowingRequest },
  })
}

export async function returnBorrowingRequest(
  request: Request,
  response: Response,
): Promise<void> {
  const input: ReturnBorrowingRequestInput = request.body
  const borrowingRequest =
    await borrowingRequestService.returnBorrowingRequest(
      getRequestId(request),
      input,
      getActorContext(request),
    )

  response.status(200).json({
    success: true,
    message: "Return processed successfully.",
    data: { request: borrowingRequest },
  })
}
