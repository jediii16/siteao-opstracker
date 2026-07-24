import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient, UserRole } from "../src/generated/prisma/client.js"
import { hashPassword } from "../src/utils/password.js"

const databaseUrl = process.env.DATABASE_URL
const username = process.env.SEED_ADMIN_USERNAME?.trim()
const password = process.env.SEED_ADMIN_PASSWORD

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed.")
}

if (!username) {
  throw new Error("SEED_ADMIN_USERNAME is required to run the seed.")
}

if (!password) {
  throw new Error("SEED_ADMIN_PASSWORD is required to run the seed.")
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
})

const prisma = new PrismaClient({ adapter })

async function main(
  adminUsername: string,
  adminPassword: string,
): Promise<void> {
  const passwordHash = await hashPassword(adminPassword)

  await prisma.user.upsert({
    where: {
      username: adminUsername,
    },
    update: {
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      committeeId: null,
      isActive: true,
    },
    create: {
      username: adminUsername,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      committeeId: null,
      isActive: true,
    },
  })

  console.log(`Super-admin account "${adminUsername}" is ready.`)
}

main(username, password)
  .catch((error: unknown) => {
    console.error("Failed to seed the initial super-admin account.", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })