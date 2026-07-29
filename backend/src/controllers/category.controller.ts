import type { Request, Response } from "express"

import * as categoryService from "../services/category.service.js"
import { AppError } from "../utils/AppError.js"
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validators/category.validation.js"

function getAuditContext(request: Request) {
  if (!request.user) {
    throw new AppError(401, "Authentication is required.")
  }

  return {
    userId: request.user.sub,
    ipAddress: request.ip,
  }
}

function getCategoryId(request: Request): string {
  const id = request.params.id

  if (typeof id !== "string") {
    throw new AppError(400, "Category ID is required.")
  }

  return id
}

function getIsActiveFilter(request: Request): boolean | undefined {
  const isActive: unknown = request.query.isActive

  if (isActive === undefined || typeof isActive === "boolean") {
    return isActive
  }

  throw new AppError(400, "isActive must be true or false.")
}

export async function getCategories(
  request: Request,
  response: Response,
): Promise<void> {
  const categories = await categoryService.getCategories(
    getIsActiveFilter(request),
  )

  response.status(200).json({
    success: true,
    data: { categories },
  })
}

export async function getCategory(
  request: Request,
  response: Response,
): Promise<void> {
  const category = await categoryService.getCategory(
    getCategoryId(request),
  )

  response.status(200).json({
    success: true,
    data: { category },
  })
}

export async function createCategory(
  request: Request,
  response: Response,
): Promise<void> {
  const input: CreateCategoryInput = request.body
  const category = await categoryService.createCategory(
    input,
    getAuditContext(request),
  )

  response.status(201).json({
    success: true,
    message: "Category created successfully.",
    data: { category },
  })
}

export async function updateCategory(
  request: Request,
  response: Response,
): Promise<void> {
  const input: UpdateCategoryInput = request.body
  const category = await categoryService.updateCategory(
    getCategoryId(request),
    input,
    getAuditContext(request),
  )

  response.status(200).json({
    success: true,
    message: "Category updated successfully.",
    data: { category },
  })
}

export async function deactivateCategory(
  request: Request,
  response: Response,
): Promise<void> {
  const category = await categoryService.deactivateCategory(
    getCategoryId(request),
    getAuditContext(request),
  )

  response.status(200).json({
    success: true,
    message: "Category deactivated successfully.",
    data: { category },
  })
}
