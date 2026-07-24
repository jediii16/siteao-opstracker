import { env } from "../config/env.js"
import * as authRepository from "../repositories/auth.repository.js"
import type {
  AuthenticatedUser,
  AuthenticationResult,
  LoginCredentials,
} from "../types/auth.types.js"
import { AppError } from "../utils/AppError.js"
import { signAccessToken } from "../utils/jwt.js"
import { comparePassword } from "../utils/password.js"
import {
  generateRefreshToken,
  hashRefreshToken,
} from "../utils/token.js"

const INVALID_CREDENTIALS_MESSAGE = "Invalid username or password."
const INVALID_REFRESH_TOKEN_MESSAGE = "Invalid or expired refresh token."
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

interface UserIdentity {
  id: string
  username: string
  role: AuthenticatedUser["role"]
  committee: AuthenticatedUser["committee"]
}

function toAuthenticatedUser(user: UserIdentity): AuthenticatedUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    committee: user.committee,
  }
}

function getRefreshTokenExpiry(): Date {
  return new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * MILLISECONDS_PER_DAY,
  )
}

function createTokenPair(user: AuthenticatedUser) {
  const refreshToken = generateRefreshToken()

  return {
    accessToken: signAccessToken(user),
    refreshToken,
    refreshTokenHash: hashRefreshToken(refreshToken),
    expiresAt: getRefreshTokenExpiry(),
  }
}

export async function login(
  credentials: LoginCredentials,
  ipAddress?: string,
): Promise<AuthenticationResult> {
  const user = await authRepository.findUserByUsername(credentials.username)

  if (!user) {
    throw new AppError(401, INVALID_CREDENTIALS_MESSAGE)
  }

  if (!user.isActive) {
    throw new AppError(403, "Account is inactive.")
  }

  const passwordMatches = await comparePassword(
    credentials.password,
    user.passwordHash,
  )

  if (!passwordMatches) {
    throw new AppError(401, INVALID_CREDENTIALS_MESSAGE)
  }

  const authenticatedUser = toAuthenticatedUser(user)
  const tokens = createTokenPair(authenticatedUser)

  await authRepository.completeLogin({
    userId: user.id,
    username: user.username,
    committeeId: user.committeeId,
    tokenHash: tokens.refreshTokenHash,
    expiresAt: tokens.expiresAt,
    ipAddress,
  })

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: authenticatedUser,
  }
}

export async function refresh(
  rawRefreshToken: string,
): Promise<AuthenticationResult> {
  const tokenHash = hashRefreshToken(rawRefreshToken)
  const storedToken =
    await authRepository.findRefreshTokenByHash(tokenHash)

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt.getTime() <= Date.now()
  ) {
    throw new AppError(401, INVALID_REFRESH_TOKEN_MESSAGE)
  }

  if (!storedToken.user.isActive) {
    throw new AppError(403, "Account is inactive.")
  }

  const authenticatedUser = toAuthenticatedUser(storedToken.user)
  const tokens = createTokenPair(authenticatedUser)
  const rotated = await authRepository.rotateRefreshToken({
    currentTokenId: storedToken.id,
    userId: storedToken.userId,
    tokenHash: tokens.refreshTokenHash,
    expiresAt: tokens.expiresAt,
  })

  if (!rotated) {
    throw new AppError(401, INVALID_REFRESH_TOKEN_MESSAGE)
  }

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: authenticatedUser,
  }
}

export async function logout(
  rawRefreshToken: string | undefined,
  ipAddress?: string,
): Promise<void> {
  if (!rawRefreshToken) {
    return
  }

  const storedToken = await authRepository.findRefreshTokenByHash(
    hashRefreshToken(rawRefreshToken),
  )

  if (!storedToken) {
    return
  }

  await authRepository.revokeRefreshTokenWithLogoutAudit({
    tokenId: storedToken.id,
    userId: storedToken.user.id,
    username: storedToken.user.username,
    committeeId: storedToken.user.committeeId,
    ipAddress,
  })
}

export async function getCurrentUser(
  userId: string,
): Promise<AuthenticatedUser> {
  const user = await authRepository.findUserById(userId)

  if (!user) {
    throw new AppError(401, "Authenticated user no longer exists.")
  }

  if (!user.isActive) {
    throw new AppError(403, "Account is inactive.")
  }

  return toAuthenticatedUser(user)
}
