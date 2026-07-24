import { prisma } from "../config/prisma.js"
import type { Prisma } from "../generated/prisma/client.js"

export interface CreateAuditLogInput {
  userId: string
  committeeId?: string | null
  action: string
  entityType: string
  entityId?: string
  description: string
  oldValues?: Prisma.InputJsonValue
  newValues?: Prisma.InputJsonValue
  ipAddress?: string
}

export function create(
  input: CreateAuditLogInput,
  client: Prisma.TransactionClient = prisma,
) {
  return client.auditLog.create({
    data: {
      userId: input.userId,
      committeeId: input.committeeId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description,
      oldValues: input.oldValues,
      newValues: input.newValues,
      ipAddress: input.ipAddress,
    },
  })
}
