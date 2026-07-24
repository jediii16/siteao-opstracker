import { z } from "zod"

import { ItemCondition } from "../generated/prisma/enums.js"

const itemCode = z
  .string()
  .trim()
  .min(2, "Item code must contain at least 2 characters.")
  .max(50, "Item code must not exceed 50 characters.")

const itemName = z
  .string()
  .trim()
  .min(2, "Item name must contain at least 2 characters.")
  .max(150, "Item name must not exceed 150 characters.")

const storageLocation = z
  .string()
  .trim()
  .min(1, "Storage location is required.")
  .max(150, "Storage location must not exceed 150 characters.")

const httpUrl = z
  .string()
  .trim()
  .url("Google Drive folder link must be a valid URL.")
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol
      return protocol === "http:" || protocol === "https:"
    } catch {
      return false
    }
  }, "Google Drive folder link must use HTTP or HTTPS.")

const googleDriveFolderLink = z.union([
  httpUrl,
  z.literal(""),
  z.null(),
])

const booleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true")

export const listItemsSchema = {
  query: z
    .object({
      search: z.string().trim().min(1).max(150).optional(),
      categoryId: z
        .string()
        .uuid("Category ID must be a valid UUID.")
        .optional(),
      condition: z.enum(ItemCondition).optional(),
      isActive: booleanQuery.optional(),
      availableOnly: booleanQuery.optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sortBy: z
        .enum([
          "name",
          "itemName",
          "itemCode",
          "totalQuantity",
          "availableQuantity",
          "createdAt",
          "updatedAt",
        ])
        .default("name"),
      sortOrder: z.enum(["asc", "desc"]).default("asc"),
    })
    .strict(),
}

export const itemIdSchema = {
  params: z
    .object({
      id: z.string().uuid("Item ID must be a valid UUID."),
    })
    .strict(),
}

export const createItemSchema = {
  body: z
    .object({
      itemCode,
      itemName,
      description: z.string().trim().nullable().optional(),
      categoryId: z.string().uuid("Category ID must be a valid UUID."),
      totalQuantity: z.number().int().min(1),
      condition: z.enum(ItemCondition),
      storageLocation,
      googleDriveFolderLink: googleDriveFolderLink.optional(),
    })
    .strict(),
}

export const updateItemSchema = {
  params: itemIdSchema.params,
  body: z
    .object({
      itemCode: itemCode.optional(),
      itemName: itemName.optional(),
      description: z.string().trim().nullable().optional(),
      categoryId: z
        .string()
        .uuid("Category ID must be a valid UUID.")
        .optional(),
      totalQuantity: z.number().int().min(1).optional(),
      condition: z.enum(ItemCondition).optional(),
      storageLocation: storageLocation.optional(),
      googleDriveFolderLink: googleDriveFolderLink.optional(),
      isActive: z.boolean().optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field must be provided.",
    }),
}

export type ListItemsQuery = z.infer<typeof listItemsSchema.query>
export type CreateItemInput = z.infer<typeof createItemSchema.body>
export type UpdateItemInput = z.infer<typeof updateItemSchema.body>
