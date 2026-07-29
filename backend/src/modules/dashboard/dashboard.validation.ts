import { z } from "zod"

export const dashboardQuerySchema = {
  query: z
    .object({
      months: z.coerce.number().int().min(1).max(24).default(12),
      recentLimit: z.coerce
        .number()
        .int()
        .min(1)
        .max(50)
        .default(15),
    })
    .strict(),
}

export type DashboardQueryInput = z.infer<
  typeof dashboardQuerySchema.query
>
