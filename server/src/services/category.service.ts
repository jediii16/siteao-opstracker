import { Prisma } from "../generated/prisma/client.js"
import * as auditRepository from "../repositories/audit.repository.js"
import * as categoryRepository from "../repositories/category.repository.js"
import { AppError } from "../utils/AppError.js"
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validators/category.validation.js"

export interface CategoryAuditContext {
  userId: string
  ipAddress?: string
}

type CategoryRecord = NonNullable<
  Awaited<ReturnType<typeof categoryRepository.findById>>
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
  category: CategoryRecord,
): Prisma.InputJsonObject {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }
}

function duplicateNameError(): AppError {
  return new AppError(409, "A category with this name already exists.")
}

function categoryInUseError(): AppError {
  return new AppError(
    409,
    "Category cannot be deactivated while active inventory items still use it.",
  )
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

async function requireCategory(id: string) {
  const category = await categoryRepository.findById(id)

  if (!category) {
    throw new AppError(404, "Category not found.")
  }

  return category
}

export function getCategories(isActive?: boolean) {
  return categoryRepository.findMany(isActive)
}

export function getCategory(id: string) {
  return requireCategory(id)
}

export async function createCategory(
  input: CreateCategoryInput,
  auditContext: CategoryAuditContext,
) {
  const data = {
    name: input.name.trim(),
    description: normalizeDescription(input.description) ?? null,
    createdBy: auditContext.userId,
  }
  const existingCategory = await categoryRepository.findByName(data.name)

  if (existingCategory) {
    throw duplicateNameError()
  }

  try {
    return await categoryRepository.transaction(async (transaction) => {
      const category = await categoryRepository.create(data, transaction)

      await auditRepository.create(
        {
          userId: auditContext.userId,
          action: "CATEGORY_CREATED",
          entityType: "Category",
          entityId: category.id,
          description: `Category "${category.name}" was created.`,
          newValues: toAuditValues(category),
          ipAddress: auditContext.ipAddress,
        },
        transaction,
      )

      return category
    })
  } catch (error: unknown) {
    return handleUniqueConstraint(error)
  }
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
  auditContext: CategoryAuditContext,
) {
  const existingCategory = await requireCategory(id)
  const data: categoryRepository.UpdateCategoryData = {}

  if (input.name !== undefined) {
    data.name = input.name.trim()
    const duplicate = await categoryRepository.findByName(data.name)

    if (duplicate && duplicate.id !== id) {
      throw duplicateNameError()
    }
  }

  if (input.description !== undefined) {
    data.description = normalizeDescription(input.description) ?? null
  }

  if (input.isActive !== undefined) {
    if (input.isActive === false && !existingCategory.isActive) {
      throw new AppError(409, "Category is already inactive.")
    }

    data.isActive = input.isActive
  }

  try {
    return await categoryRepository.transaction(async (transaction) => {
      if (existingCategory.isActive && data.isActive === false) {
        const activeItemCount =
          await categoryRepository.countActiveItemsByCategoryId(
            id,
            transaction,
          )

        if (activeItemCount > 0) {
          throw categoryInUseError()
        }
      }

      const category = await categoryRepository.update(
        id,
        data,
        transaction,
      )
      const action =
        existingCategory.isActive !== category.isActive
          ? category.isActive
            ? "CATEGORY_ACTIVATED"
            : "CATEGORY_DEACTIVATED"
          : "CATEGORY_UPDATED"

      await auditRepository.create(
        {
          userId: auditContext.userId,
          action,
          entityType: "Category",
          entityId: category.id,
          description: `Category "${category.name}" was ${action === "CATEGORY_ACTIVATED" ? "activated" : action === "CATEGORY_DEACTIVATED" ? "deactivated" : "updated"}.`,
          oldValues: toAuditValues(existingCategory),
          newValues: toAuditValues(category),
          ipAddress: auditContext.ipAddress,
        },
        transaction,
      )

      return category
    })
  } catch (error: unknown) {
    return handleUniqueConstraint(error)
  }
}

export async function deactivateCategory(
  id: string,
  auditContext: CategoryAuditContext,
) {
  const existingCategory = await requireCategory(id)

  if (!existingCategory.isActive) {
    throw new AppError(409, "Category is already inactive.")
  }

  return categoryRepository.transaction(async (transaction) => {
    const activeItemCount =
      await categoryRepository.countActiveItemsByCategoryId(
        id,
        transaction,
      )

    if (activeItemCount > 0) {
      throw categoryInUseError()
    }

    const category = await categoryRepository.deactivate(id, transaction)

    await auditRepository.create(
      {
        userId: auditContext.userId,
        action: "CATEGORY_DEACTIVATED",
        entityType: "Category",
        entityId: category.id,
        description: `Category "${category.name}" was deactivated.`,
        oldValues: toAuditValues(existingCategory),
        newValues: toAuditValues(category),
        ipAddress: auditContext.ipAddress,
      },
      transaction,
    )

    return category
  })
}
