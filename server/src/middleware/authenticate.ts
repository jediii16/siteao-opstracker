import type { NextFunction, Request, Response } from "express"

import { AppError } from "../utils/AppError.js"
import { verifyAccessToken } from "../utils/jwt.js"

export function authenticate(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  const authorization = request.headers.authorization
  const match = authorization?.match(/^Bearer\s+(.+)$/i)

  if (!match?.[1]) {
    next(new AppError(401, "Access token is required."))
    return
  }

  try {
    request.user = verifyAccessToken(match[1])
    next()
  } catch {
    next(new AppError(401, "Invalid or expired access token."))
  }
}
