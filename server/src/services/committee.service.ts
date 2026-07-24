import { Prisma } from "../generated/prisma/client.js"
import * as auditRepository from "../repositories/audit.repository.js"
import * as committeeRepository from "../repositories/committee.repository.js"
import type {
  CreateCommitteeInput,
  UpdateCommitteeInput,
} from "../validators/committee.validation.js"
import { AppError } from "../utils/AppError.js"

export interface CommitteeAuditContext {
  userId: string
  ipAddress?: string
}

type CommitteeRecord = NonNullable<
  Awaited<ReturnType<typeof committeeRepository.findById>>
>

function normalizeDescription(
  description: string | null | undefined,
): string | null | undefined {
  if (description === undefined || description === null) {
    return description
  }

  const normalized = description.trim()
  return normalized.length > 0 ? normalized : null
}

function toAuditValues(
  committee: CommitteeRecord,
): Prisma.InputJsonObject {
  return {
    id: committee.id,
    name: committee.name,
    description: committee.description,
    isActive: committee.isActive,
    createdAt: committee.createdAt.toISOString(),
    updatedAt: committee.updatedAt.toISOString(),
  }
}

function duplicateNameError(): AppError {
  return new AppError(409, "A committee with this name already exists.")
}

function handleUniqueConstraint(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw duplicateNameError()
  }

  throw error
}

export function getCommittees() {
  return committeeRepository.findMany()
}

export async function getCommittee(id: string) {
  const committee = await committeeRepository.findById(id)

  if (!committee) {
    throw new AppError(404, "Committee not found.")
  }

  return committee
}

export async function createCommittee(
  input: CreateCommitteeInput,
  auditContext: CommitteeAuditContext,
) {
  const data = {
    name: input.name.trim(),
    description: normalizeDescription(input.description) ?? null,
  }

  const existingCommittee = await committeeRepository.findByName(data.name)

  if (existingCommittee) {
    throw duplicateNameError()
  }

  try {
    return await committeeRepository.transaction(async (transaction) => {
      const committee = await committeeRepository.create(data, transaction)

      await auditRepository.create(
        {
          userId: auditContext.userId,
          committeeId: committee.id,
          action: "COMMITTEE_CREATED",
          entityType: "Committee",
          entityId: committee.id,
          description: `Committee "${committee.name}" was created.`,
          newValues: toAuditValues(committee),
          ipAddress: auditContext.ipAddress,
        },
        transaction,
      )

      return committee
    })
  } catch (error: unknown) {
    return handleUniqueConstraint(error)
  }
}

export async function updateCommittee(
  id: string,
  input: UpdateCommitteeInput,
  auditContext: CommitteeAuditContext,
) {
  const existingCommittee = await getCommittee(id)
  const data: committeeRepository.UpdateCommitteeData = {}

  if (input.name !== undefined) {
    data.name = input.name.trim()
    const duplicate = await committeeRepository.findByName(data.name)

    if (duplicate && duplicate.id !== id) {
      throw duplicateNameError()
    }
  }

  if (input.description !== undefined) {
    data.description = normalizeDescription(input.description) ?? null
  }

  if (input.isActive !== undefined) {
    data.isActive = input.isActive
  }

  try {
    return await committeeRepository.transaction(async (transaction) => {
      const committee = await committeeRepository.update(
        id,
        data,
        transaction,
      )

      await auditRepository.create(
        {
          userId: auditContext.userId,
          committeeId: committee.id,
          action: "COMMITTEE_UPDATED",
          entityType: "Committee",
          entityId: committee.id,
          description: `Committee "${committee.name}" was updated.`,
          oldValues: toAuditValues(existingCommittee),
          newValues: toAuditValues(committee),
          ipAddress: auditContext.ipAddress,
        },
        transaction,
      )

      return committee
    })
  } catch (error: unknown) {
    return handleUniqueConstraint(error)
  }
}

export async function deactivateCommittee(
  id: string,
  auditContext: CommitteeAuditContext,
) {
  const existingCommittee = await getCommittee(id)

  if (!existingCommittee.isActive) {
    throw new AppError(409, "Committee is already inactive.")
  }

  return committeeRepository.transaction(async (transaction) => {
    const committee = await committeeRepository.deactivate(id, transaction)

    await auditRepository.create(
      {
        userId: auditContext.userId,
        committeeId: committee.id,
        action: "COMMITTEE_DEACTIVATED",
        entityType: "Committee",
        entityId: committee.id,
        description: `Committee "${committee.name}" was deactivated.`,
        oldValues: toAuditValues(existingCommittee),
        newValues: toAuditValues(committee),
        ipAddress: auditContext.ipAddress,
      },
      transaction,
    )

    return committee
  })
}
