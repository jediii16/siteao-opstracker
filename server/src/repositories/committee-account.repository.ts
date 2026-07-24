import { prisma } from "../config/prisma.js"
import { Prisma, UserRole } from "../generated/prisma/client.js"

const committeeAccountSelect = {
  id: true,
  committeeId: true,
  username: true,
  role: true,
  isActive: true,
  passwordChangedAt: true,
  createdAt: true,
  updatedAt: true,
  committee: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
} satisfies Prisma.UserSelect

type UserClient = Pick<Prisma.TransactionClient, "user">

export interface CreateCommitteeAccountData {
  username: string
  passwordHash: string
  committeeId: string
}

export function findCommitteeAccounts() {
  return prisma.user.findMany({
    where: {
      role: UserRole.COMMITTEE,
      committeeId: { not: null },
    },
    select: committeeAccountSelect,
    orderBy: { username: "asc" },
  })
}

export function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: committeeAccountSelect,
  })
}

export function findByUsername(username: string) {
  return prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: committeeAccountSelect,
  })
}

export function findByCommitteeId(committeeId: string) {
  return prisma.user.findUnique({
    where: { committeeId },
    select: committeeAccountSelect,
  })
}

export function createCommitteeAccount(
  data: CreateCommitteeAccountData,
  client: UserClient = prisma,
) {
  return client.user.create({
    data: {
      username: data.username,
      passwordHash: data.passwordHash,
      committeeId: data.committeeId,
      role: UserRole.COMMITTEE,
      isActive: true,
    },
    select: committeeAccountSelect,
  })
}

export function updateCommitteeAccount(
  id: string,
  username: string,
  client: UserClient = prisma,
) {
  return client.user.update({
    where: { id },
    data: { username },
    select: committeeAccountSelect,
  })
}

export function updatePassword(
  id: string,
  passwordHash: string,
  client: UserClient = prisma,
) {
  return client.user.update({
    where: { id },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
    },
    select: committeeAccountSelect,
  })
}

export function updateStatus(
  id: string,
  isActive: boolean,
  client: UserClient = prisma,
) {
  return client.user.update({
    where: { id },
    data: { isActive },
    select: committeeAccountSelect,
  })
}

export function transaction<T>(
  operation: (client: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(operation)
}
