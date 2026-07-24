import jwt, { type SignOptions } from "jsonwebtoken"
import { z } from "zod"

import { env } from "../config/env.js"
import { UserRole } from "../generated/prisma/enums.js"
import type {
  AccessTokenPayload,
  AuthenticatedUser,
} from "../types/auth.types.js"
import { AppError } from "./AppError.js"

const verifiedPayloadSchema = z
  .object({
    sub: z.string().uuid(),
    username: z.string().min(1),
    role: z.enum(UserRole),
    committeeId: z.string().uuid().nullable(),
    iat: z.number().optional(),
    exp: z.number().optional(),
  })
  .strict()

export function signAccessToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      committeeId: user.committee?.id ?? null,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    },
  )
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET)
  const parsedPayload = verifiedPayloadSchema.safeParse(decoded)

  if (!parsedPayload.success) {
    throw new AppError(401, "Invalid or expired access token.")
  }

  return parsedPayload.data
}
