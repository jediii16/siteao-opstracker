import type { JwtPayload } from "jsonwebtoken"

import type { UserRole } from "../generated/prisma/enums.js"

export interface CommitteeSummary {
  id: string
  name: string
}

export interface AuthenticatedUser {
  id: string
  username: string
  role: UserRole
  committee: CommitteeSummary | null
}

export interface AccessTokenPayload extends JwtPayload {
  sub: string
  username: string
  role: UserRole
  committeeId: string | null
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthenticationResult {
  accessToken: string
  refreshToken: string
  user: AuthenticatedUser
}
