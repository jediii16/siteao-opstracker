import { z } from "zod"

const username = z
  .string()
  .trim()
  .min(3, "Username must contain at least 3 characters.")
  .max(50, "Username must not exceed 50 characters.")

const password = z
  .string()
  .min(12, "Password must contain at least 12 characters.")
  .max(128, "Password must not exceed 128 characters.")

export const committeeAccountIdSchema = {
  params: z
    .object({
      id: z.string().uuid("User ID must be a valid UUID."),
    })
    .strict(),
}

export const createCommitteeAccountSchema = {
  body: z
    .object({
      username,
      password,
      committeeId: z.string().uuid("Committee ID must be a valid UUID."),
    })
    .strict(),
}

export const updateCommitteeAccountSchema = {
  params: committeeAccountIdSchema.params,
  body: z
    .object({
      username: username.optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field must be provided.",
    }),
}

export const resetCommitteeAccountPasswordSchema = {
  params: committeeAccountIdSchema.params,
  body: z
    .object({
      newPassword: password,
    })
    .strict(),
}

export const updateCommitteeAccountStatusSchema = {
  params: committeeAccountIdSchema.params,
  body: z
    .object({
      isActive: z.boolean(),
    })
    .strict(),
}

export type CreateCommitteeAccountInput = z.infer<
  typeof createCommitteeAccountSchema.body
>
export type UpdateCommitteeAccountInput = z.infer<
  typeof updateCommitteeAccountSchema.body
>
export type ResetCommitteeAccountPasswordInput = z.infer<
  typeof resetCommitteeAccountPasswordSchema.body
>
export type UpdateCommitteeAccountStatusInput = z.infer<
  typeof updateCommitteeAccountStatusSchema.body
>
