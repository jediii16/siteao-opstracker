import { prisma } from "../config/prisma.js"

const committeeSelection = {
  select: {
    id: true,
    name: true,
  },
} as const

export function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      role: true,
      isActive: true,
      committeeId: true,
      committee: committeeSelection,
    },
  })
}

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      committee: committeeSelection,
    },
  })
}

interface CompleteLoginInput {
  userId: string
  username: string
  committeeId: string | null
  tokenHash: string
  expiresAt: Date
  ipAddress?: string
}

export function completeLogin(input: CompleteLoginInput) {
  return prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: input.userId },
      data: { lastLoginAt: new Date() },
    })

    await transaction.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    })

    await transaction.auditLog.create({
      data: {
        userId: input.userId,
        committeeId: input.committeeId,
        action: "LOGIN",
        entityType: "User",
        entityId: input.userId,
        description: `User "${input.username}" logged in.`,
        ipAddress: input.ipAddress,
      },
    })
  })
}

export function findRefreshTokenByHash(tokenHash: string) {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          committeeId: true,
          committee: committeeSelection,
        },
      },
    },
  })
}

interface RotateRefreshTokenInput {
  currentTokenId: string
  userId: string
  tokenHash: string
  expiresAt: Date
}

export function rotateRefreshToken(
  input: RotateRefreshTokenInput,
): Promise<boolean> {
  return prisma.$transaction(async (transaction) => {
    const now = new Date()
    const revokeResult = await transaction.refreshToken.updateMany({
      where: {
        id: input.currentTokenId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { revokedAt: now },
    })

    if (revokeResult.count !== 1) {
      return false
    }

    await transaction.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    })

    return true
  })
}

interface LogoutAuditInput {
  tokenId: string
  userId: string
  username: string
  committeeId: string | null
  ipAddress?: string
}

export function revokeRefreshTokenWithLogoutAudit(
  input: LogoutAuditInput,
) {
  return prisma.$transaction(async (transaction) => {
    await transaction.refreshToken.updateMany({
      where: {
        id: input.tokenId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })

    await transaction.auditLog.create({
      data: {
        userId: input.userId,
        committeeId: input.committeeId,
        action: "LOGOUT",
        entityType: "User",
        entityId: input.userId,
        description: `User "${input.username}" logged out.`,
        ipAddress: input.ipAddress,
      },
    })
  })
}
