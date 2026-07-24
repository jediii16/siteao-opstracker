import type { NextFunction, Request, Response } from "express"

export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  console.error(error)

  response.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  })
}