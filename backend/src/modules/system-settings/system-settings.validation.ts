import { z } from "zod"

export const updateSystemSettingsSchema = {
  body: z
    .object({
      siteaoGovernorName: z
        .string()
        .trim()
        .min(2, "SITEAO Governor name must contain at least 2 characters.")
        .max(150, "SITEAO Governor name must not exceed 150 characters."),
    })
    .strict(),
}

export type UpdateSystemSettingsInput = z.infer<
  typeof updateSystemSettingsSchema.body
>
