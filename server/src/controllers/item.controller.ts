import type { Request, Response } from "express"

import * as borrowingRequestService from "../services/borrowing-request.service.js"
import * as itemService from "../services/item.service.js"
import { AppError } from "../utils/AppError.js"
import type { ItemBorrowingHistoryQuery } from "../validators/borrowing-request.validation.js"
import type {
  CreateItemInput,
  ListItemsQuery,
  UpdateItemInput,
} from "../validators/item.validation.js"

function getAuditContext(request: Request) {
  if (!request.user) {
    throw new AppError(401, "Authentication is required.")
  }

  return {
    userId: request.user.sub,
    ipAddress: request.ip,
  }
}

function getBorrowingActorContext(request: Request) {
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

function getItemId(request: Request): string {
  const id = request.params.id

  if (typeof id !== "string") {
    throw new AppError(400, "Item ID is required.")
  }

  return id
}

export async function getItems(
  request: Request,
  response: Response,
): Promise<void> {
  const query = request.query as unknown as ListItemsQuery
  const result = await itemService.getItems(query)

  response.status(200).json({
    success: true,
    data: result,
  })
}

export async function getItem(
  request: Request,
  response: Response,
): Promise<void> {
  const item = await itemService.getItem(getItemId(request))

  response.status(200).json({
    success: true,
    data: { item },
  })
}

export async function getItemBorrowingHistory(
  request: Request,
  response: Response,
): Promise<void> {
  const query =
    request.query as unknown as ItemBorrowingHistoryQuery
  const result =
    await borrowingRequestService.getItemBorrowingHistory(
      getItemId(request),
      query,
      getBorrowingActorContext(request),
    )

  response.status(200).json({
    success: true,
    data: result,
  })
}

export async function createItem(
  request: Request,
  response: Response,
): Promise<void> {
  const input: CreateItemInput = request.body
  const item = await itemService.createItem(
    input,
    getAuditContext(request),
  )

  response.status(201).json({
    success: true,
    message: "Item created successfully.",
    data: { item },
  })
}

export async function updateItem(
  request: Request,
  response: Response,
): Promise<void> {
  const input: UpdateItemInput = request.body
  const item = await itemService.updateItem(
    getItemId(request),
    input,
    getAuditContext(request),
  )

  response.status(200).json({
    success: true,
    message: "Item updated successfully.",
    data: { item },
  })
}

export async function deactivateItem(
  request: Request,
  response: Response,
): Promise<void> {
  const item = await itemService.deactivateItem(
    getItemId(request),
    getAuditContext(request),
  )

  response.status(200).json({
    success: true,
    message: "Item deactivated successfully.",
    data: { item },
  })
}
