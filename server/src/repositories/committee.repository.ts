import { prisma } from "../config/prisma.js"
import type { Prisma } from "../generated/prisma/client.js"

const committeeSelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CommitteeSelect

type CommitteeClient = Pick<Prisma.TransactionClient, "committee">

export interface CreateCommitteeData {
  name: string
  description: string | null
}

export interface UpdateCommitteeData {
  name?: string
  description?: string | null
  isActive?: boolean
}

export function findMany() {
  return prisma.committee.findMany({
    select: committeeSelect,
    orderBy: { name: "asc" },
  })
}

export function findById(id: string) {
  return prisma.committee.findUnique({
    where: { id },
    select: committeeSelect,
  })
}

export function findByName(name: string) {
  return prisma.committee.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
    select: committeeSelect,
  })
}

export function create(
  data: CreateCommitteeData,
  client: CommitteeClient = prisma,
) {
  return client.committee.create({
    data,
    select: committeeSelect,
  })
}

export function update(
  id: string,
  data: UpdateCommitteeData,
  client: CommitteeClient = prisma,
) {
  return client.committee.update({
    where: { id },
    data,
    select: committeeSelect,
  })
}

export function deactivate(
  id: string,
  client: CommitteeClient = prisma,
) {
  return client.committee.update({
    where: { id },
    data: { isActive: false },
    select: committeeSelect,
  })
}

export function transaction<T>(
  operation: (client: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(operation)
}
