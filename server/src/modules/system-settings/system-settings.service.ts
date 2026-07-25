import { UserRole, type Prisma } from "../../generated/prisma/client.js"
import * as auditRepository from "../../repositories/audit.repository.js"
import { AppError } from "../../utils/AppError.js"
import { inventoryReportConfig } from "../reports/reports.config.js"
import * as systemSettingsRepository from "./system-settings.repository.js"
import type { UpdateSystemSettingsInput } from "./system-settings.validation.js"

export interface SystemSettingsAuditContext {
  userId: string
  ipAddress?: string
}

export function getDefaultSystemSettings() {
  return {
    id: systemSettingsRepository.SYSTEM_SETTINGS_ID,
    siteaoGovernorName: inventoryReportConfig.notedBy.name,
    updatedAt: null,
    updater: null,
  }
}

export async function getSystemSettings() {
  return (
    (await systemSettingsRepository.findSystemSettings()) ??
    getDefaultSystemSettings()
  )
}

async function requireSuperAdmin(userId: string) {
  const actor = await systemSettingsRepository.findActor(userId)

  if (!actor) {
    throw new AppError(401, "Authenticated user no longer exists.")
  }

  if (!actor.isActive || actor.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, "System settings access is not authorized.")
  }

  return actor
}

export async function updateSystemSettings(
  input: UpdateSystemSettingsInput,
  auditContext: SystemSettingsAuditContext,
) {
  await requireSuperAdmin(auditContext.userId)
  const existing = await getSystemSettings()
  const siteaoGovernorName = input.siteaoGovernorName.trim()

  if (existing.siteaoGovernorName === siteaoGovernorName) {
    return existing
  }

  return systemSettingsRepository.transaction(async (transaction) => {
    const settings = await systemSettingsRepository.upsertSystemSettings(
      siteaoGovernorName,
      auditContext.userId,
      transaction,
    )

    await auditRepository.create(
      {
        userId: auditContext.userId,
        action: "SYSTEM_SETTINGS_UPDATED",
        entityType: "SystemSettings",
        description: `SITEAO Governor was changed to "${siteaoGovernorName}".`,
        oldValues: {
          siteaoGovernorName: existing.siteaoGovernorName,
        } satisfies Prisma.InputJsonObject,
        newValues: {
          siteaoGovernorName: settings.siteaoGovernorName,
        } satisfies Prisma.InputJsonObject,
        ipAddress: auditContext.ipAddress,
      },
      transaction,
    )

    return settings
  })
}
