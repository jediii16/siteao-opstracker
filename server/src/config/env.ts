const port = Number(process.env.PORT ?? 5000)

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a valid positive number.")
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.")
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: port,
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL,
}