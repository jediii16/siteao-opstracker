import { z } from "zod"

const committeeName = z
  .string()
  .trim()
  .min(1, "Committee name is required.")
  .max(100, "Committee name must not exceed 100 characters.")

const committeeDescription = z.string().trim()

export const committeeIdSchema = {
  params: z
    .object({
      id: z.string().uuid("Committee ID must be a valid UUID."),
    })
    .strict(),
}

export const createCommitteeSchema = {
  body: z
    .object({
      name: committeeName,
      description: committeeDescription.optional(),
    })
    .strict(),
}

export const updateCommitteeSchema = {
  params: committeeIdSchema.params,
  body: z
    .object({
      name: committeeName.optional(),
      description: committeeDescription.nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field must be provided.",
    }),
}

export type CreateCommitteeInput = z.infer<
  typeof createCommitteeSchema.body
>
export type UpdateCommitteeInput = z.infer<
  typeof updateCommitteeSchema.body
>
