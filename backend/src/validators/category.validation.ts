import { z } from "zod"

const categoryName = z
  .string()
  .trim()
  .min(2, "Category name must contain at least 2 characters.")
  .max(100, "Category name must not exceed 100 characters.")

const categoryDescription = z.string().trim()

export const listCategoriesSchema = {
  query: z
    .object({
      isActive: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),
    })
    .strict(),
}

export const categoryIdSchema = {
  params: z
    .object({
      id: z.string().uuid("Category ID must be a valid UUID."),
    })
    .strict(),
}

export const createCategorySchema = {
  body: z
    .object({
      name: categoryName,
      description: categoryDescription.nullable().optional(),
    })
    .strict(),
}

export const updateCategorySchema = {
  params: categoryIdSchema.params,
  body: z
    .object({
      name: categoryName.optional(),
      description: categoryDescription.nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field must be provided.",
    }),
}

export type CreateCategoryInput = z.infer<
  typeof createCategorySchema.body
>
export type UpdateCategoryInput = z.infer<
  typeof updateCategorySchema.body
>
