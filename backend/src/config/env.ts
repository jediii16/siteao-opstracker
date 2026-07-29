import { z } from "zod"

const optionalNonEmptyString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === ""
      ? undefined
      : value,
  z.string().trim().min(1).optional(),
)

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required."),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default("15m"),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_NAME: z.string().min(1).default("siteao_refresh_token"),
  PUPPETEER_EXECUTABLE_PATH: optionalNonEmptyString,
  PUPPETEER_HEADLESS: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
})

const parsedEnvironment = environmentSchema.safeParse(process.env)

if (!parsedEnvironment.success) {
  const details = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ")

  throw new Error(`Invalid environment configuration: ${details}`)
}

export const env = parsedEnvironment.data
