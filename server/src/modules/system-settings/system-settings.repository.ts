import { prisma } from "../../config/prisma.js"
import type { Prisma } from "../../generated/prisma/client.js"

export const SYSTEM_SETTINGS_ID = "siteao"

export function findSystemSettings() {
  return prisma.systemSetting.findUnique({
    where: { id: SYSTEM_SETTINGS_ID },
    select: {
      id: true,
      siteaoGovernorName: true,
      updatedAt: true,
      updater: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  })
}

export function findActor(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  })
}

export function upsertSystemSettings(
  siteaoGovernorName: string,
  updatedBy: string,
  client: Prisma.TransactionClient = prisma,
) {
  return client.systemSetting.upsert({
    where: { id: SYSTEM_SETTINGS_ID },
    update: {
      siteaoGovernorName,
      updatedBy,
    },
    create: {
      id: SYSTEM_SETTINGS_ID,
      siteaoGovernorName,
      updatedBy,
    },
    select: {
      id: true,
      siteaoGovernorName: true,
      updatedAt: true,
      updater: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  })
}

export function transaction<T>(
  operation: (client: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(operation)
}
