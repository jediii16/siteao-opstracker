import type { NextFunction, Request, Response } from "express"

import { AppError } from "../utils/AppError.js"

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
    return
  }

  console.error(error)

  response.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  })
}
