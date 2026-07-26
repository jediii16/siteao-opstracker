import type { CookieOptions, Request, Response } from "express"

import { env } from "../config/env.js"
import * as authService from "../services/auth.service.js"
import type { LoginInput } from "../validators/auth.validator.js"
import { AppError } from "../utils/AppError.js"

const isProduction = env.NODE_ENV === "production"

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  maxAge: env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  path: "/api/auth",
}

const clearRefreshCookieOptions: CookieOptions = {
  httpOnly: refreshCookieOptions.httpOnly,
  sameSite: refreshCookieOptions.sameSite,
  secure: refreshCookieOptions.secure,
  path: refreshCookieOptions.path,
}

function getRefreshCookie(request: Request): string | undefined {
  const cookieValue: unknown = request.cookies?.[env.COOKIE_NAME]
  return typeof cookieValue === "string" ? cookieValue : undefined
}

export async function login(
  request: Request,
  response: Response,
): Promise<void> {
  const credentials: LoginInput = request.body
  const result = await authService.login(credentials, request.ip)

  response.cookie(
    env.COOKIE_NAME,
    result.refreshToken,
    refreshCookieOptions,
  )

  response.status(200).json({
    success: true,
    message: "Login successful.",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  })
}

export async function refresh(
  request: Request,
  response: Response,
): Promise<void> {
  const refreshToken = getRefreshCookie(request)

  if (!refreshToken) {
    throw new AppError(401, "Refresh token is required.")
  }

  const result = await authService.refresh(refreshToken)

  response.cookie(
    env.COOKIE_NAME,
    result.refreshToken,
    refreshCookieOptions,
  )

  response.status(200).json({
    success: true,
    message: "Token refreshed.",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  })
}

export async function logout(
  request: Request,
  response: Response,
): Promise<void> {
  await authService.logout(getRefreshCookie(request), request.ip)
  response.clearCookie(env.COOKIE_NAME, clearRefreshCookieOptions)

  response.status(200).json({
    success: true,
    message: "Logout successful.",
  })
}

export async function me(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.user) {
    throw new AppError(401, "Authentication is required.")
  }

  const user = await authService.getCurrentUser(request.user.sub)

  response.status(200).json({
    success: true,
    data: { user },
  })
}
