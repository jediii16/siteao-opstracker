import { Prisma, UserRole } from "../generated/prisma/client.js"
import * as auditRepository from "../repositories/audit.repository.js"
import * as committeeAccountRepository from "../repositories/committee-account.repository.js"
import * as committeeRepository from "../repositories/committee.repository.js"
import { AppError } from "../utils/AppError.js"
import { hashPassword } from "../utils/password.js"
import type {
  CreateCommitteeAccountInput,
  ResetCommitteeAccountPasswordInput,
  UpdateCommitteeAccountInput,
  UpdateCommitteeAccountStatusInput,
} from "../validators/committee-account.validation.js"

export interface CommitteeAccountAuditContext {
  userId: string
  ipAddress?: string
}

type CommitteeAccountRecord = NonNullable<
  Awaited<ReturnType<typeof committeeAccountRepository.findById>>
>

function toSafeUser(account: CommitteeAccountRecord) {
  return {
    id: account.id,
    username: account.username,
    role: account.role,
    isActive: account.isActive,
    committee: account.committee
      ? {
          id: account.committee.id,
          name: account.committee.name,
        }
      : null,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }
}

function toAuditValues(
  account: CommitteeAccountRecord,
): Prisma.InputJsonObject {
  return {
    id: account.id,
    username: account.username,
    role: account.role,
    isActive: account.isActive,
    committeeId: account.committeeId,
    passwordChangedAt: account.passwordChangedAt?.toISOString() ?? null,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  }
}

function duplicateUsernameError(): AppError {
  return new AppError(409, "A user with this username already exists.")
}

function duplicateCommitteeAccountError(): AppError {
  return new AppError(409, "This committee already has a shared account.")
}

function handleUniqueConstraint(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target
    const targetText = Array.isArray(target)
      ? target.join(" ")
      : String(target ?? "")

    if (targetText.toLowerCase().includes("committee")) {
      throw duplicateCommitteeAccountError()
    }

    throw duplicateUsernameError()
  }

  throw error
}

async function getCommitteeAccount(id: string) {
  const account = await committeeAccountRepository.findById(id)

  if (!account) {
    throw new AppError(404, "Committee account not found.")
  }

  if (account.role !== UserRole.COMMITTEE) {
    throw new AppError(403, "SUPER_ADMIN accounts cannot be modified here.")
  }

  if (!account.committeeId || !account.committee) {
    throw new AppError(
      409,
      "Committee account is not linked to a committee.",
    )
  }

  return account
}

export async function getCommitteeAccounts() {
  const accounts =
    await committeeAccountRepository.findCommitteeAccounts()
  return accounts.map(toSafeUser)
}

export async function createCommitteeAccount(
  input: CreateCommitteeAccountInput,
  auditContext: CommitteeAccountAuditContext,
) {
  const username = input.username.trim()
  const committee = await committeeRepository.findById(input.committeeId)

  if (!committee) {
    throw new AppError(404, "Committee not found.")
  }

  if (!committee.isActive) {
    throw new AppError(
      409,
      "Cannot create an account for an inactive committee.",
    )
  }

  const existingUsername =
    await committeeAccountRepository.findByUsername(username)

  if (existingUsername) {
    throw duplicateUsernameError()
  }

  const existingCommitteeAccount =
    await committeeAccountRepository.findByCommitteeId(input.committeeId)

  if (existingCommitteeAccount) {
    throw duplicateCommitteeAccountError()
  }

  const passwordHash = await hashPassword(input.password)

  try {
    const account = await committeeAccountRepository.transaction(
      async (transaction) => {
        const createdAccount =
          await committeeAccountRepository.createCommitteeAccount(
            {
              username,
              passwordHash,
              committeeId: committee.id,
            },
            transaction,
          )

        await auditRepository.create(
          {
            userId: auditContext.userId,
            committeeId: committee.id,
            action: "COMMITTEE_ACCOUNT_CREATED",
            entityType: "User",
            entityId: createdAccount.id,
            description: `Committee account "${createdAccount.username}" was created.`,
            newValues: toAuditValues(createdAccount),
            ipAddress: auditContext.ipAddress,
          },
          transaction,
        )

        return createdAccount
      },
    )

    return toSafeUser(account)
  } catch (error: unknown) {
    return handleUniqueConstraint(error)
  }
}

export async function updateCommitteeAccount(
  id: string,
  input: UpdateCommitteeAccountInput,
  auditContext: CommitteeAccountAuditContext,
) {
  const existingAccount = await getCommitteeAccount(id)

  if (input.username === undefined) {
    throw new AppError(400, "Username is required for this update.")
  }

  const username = input.username.trim()
  const duplicate =
    await committeeAccountRepository.findByUsername(username)

  if (duplicate && duplicate.id !== id) {
    throw duplicateUsernameError()
  }

  try {
    const account = await committeeAccountRepository.transaction(
      async (transaction) => {
        const updatedAccount =
          await committeeAccountRepository.updateCommitteeAccount(
            id,
            username,
            transaction,
          )

        await auditRepository.create(
          {
            userId: auditContext.userId,
            committeeId: existingAccount.committeeId,
            action: "COMMITTEE_ACCOUNT_UPDATED",
            entityType: "User",
            entityId: id,
            description: `Committee account "${updatedAccount.username}" was updated.`,
            oldValues: toAuditValues(existingAccount),
            newValues: toAuditValues(updatedAccount),
            ipAddress: auditContext.ipAddress,
          },
          transaction,
        )

        return updatedAccount
      },
    )

    return toSafeUser(account)
  } catch (error: unknown) {
    return handleUniqueConstraint(error)
  }
}

export async function resetCommitteeAccountPassword(
  id: string,
  input: ResetCommitteeAccountPasswordInput,
  auditContext: CommitteeAccountAuditContext,
): Promise<void> {
  const existingAccount = await getCommitteeAccount(id)
  const passwordHash = await hashPassword(input.newPassword)

  await committeeAccountRepository.transaction(async (transaction) => {
    const updatedAccount = await committeeAccountRepository.updatePassword(
      id,
      passwordHash,
      transaction,
    )

    await auditRepository.create(
      {
        userId: auditContext.userId,
        committeeId: existingAccount.committeeId,
        action: "COMMITTEE_ACCOUNT_PASSWORD_RESET",
        entityType: "User",
        entityId: id,
        description: `Password was reset for committee account "${existingAccount.username}".`,
        oldValues: toAuditValues(existingAccount),
        newValues: toAuditValues(updatedAccount),
        ipAddress: auditContext.ipAddress,
      },
      transaction,
    )
  })
}

export async function updateCommitteeAccountStatus(
  id: string,
  input: UpdateCommitteeAccountStatusInput,
  auditContext: CommitteeAccountAuditContext,
) {
  const existingAccount = await getCommitteeAccount(id)

  if (existingAccount.isActive === input.isActive) {
    const state = input.isActive ? "active" : "inactive"
    throw new AppError(409, `Committee account is already ${state}.`)
  }

  if (input.isActive && !existingAccount.committee?.isActive) {
    throw new AppError(
      409,
      "Cannot activate an account for an inactive committee.",
    )
  }

  const account = await committeeAccountRepository.transaction(
    async (transaction) => {
      const updatedAccount =
        await committeeAccountRepository.updateStatus(
          id,
          input.isActive,
          transaction,
        )
      const action = input.isActive
        ? "COMMITTEE_ACCOUNT_ACTIVATED"
        : "COMMITTEE_ACCOUNT_DEACTIVATED"

      await auditRepository.create(
        {
          userId: auditContext.userId,
          committeeId: existingAccount.committeeId,
          action,
          entityType: "User",
          entityId: id,
          description: `Committee account "${updatedAccount.username}" was ${input.isActive ? "activated" : "deactivated"}.`,
          oldValues: toAuditValues(existingAccount),
          newValues: toAuditValues(updatedAccount),
          ipAddress: auditContext.ipAddress,
        },
        transaction,
      )

      return updatedAccount
    },
  )

  return toSafeUser(account)
}
