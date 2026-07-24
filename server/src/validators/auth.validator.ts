import { z } from "zod"

export const loginSchema = {
  body: z
    .object({
      username: z.string().trim().min(1, "Username is required.").max(50),
      password: z.string().min(1, "Password is required."),
    })
    .strict(),
}

export type LoginInput = z.infer<typeof loginSchema.body>
