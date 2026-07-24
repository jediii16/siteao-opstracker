import { prisma } from "../config/prisma.js"
import type { Prisma } from "../generated/prisma/client.js"

const categorySelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect

type CategoryClient = Pick<
  Prisma.TransactionClient,
  "category" | "item"
>

export interface CreateCategoryData {
  name: string
  description: string | null
  createdBy: string
}

export interface UpdateCategoryData {
  name?: string
  description?: string | null
  isActive?: boolean
}

export function findMany(isActive?: boolean) {
  return prisma.category.findMany({
    where: isActive === undefined ? undefined : { isActive },
    select: categorySelect,
    orderBy: { name: "asc" },
  })
}

export function findById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    select: categorySelect,
  })
}

export function findByName(name: string) {
  return prisma.category.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
    select: categorySelect,
  })
}

export function create(
  data: CreateCategoryData,
  client: CategoryClient = prisma,
) {
  return client.category.create({
    data,
    select: categorySelect,
  })
}

export function update(
  id: string,
  data: UpdateCategoryData,
  client: CategoryClient = prisma,
) {
  return client.category.update({
    where: { id },
    data,
    select: categorySelect,
  })
}

export function deactivate(
  id: string,
  client: CategoryClient = prisma,
) {
  return client.category.update({
    where: { id },
    data: { isActive: false },
    select: categorySelect,
  })
}

export function countActiveItemsByCategoryId(
  categoryId: string,
  client: CategoryClient = prisma,
) {
  return client.item.count({
    where: {
      categoryId,
      isActive: true,
    },
  })
}

export function transaction<T>(
  operation: (client: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(operation)
}
