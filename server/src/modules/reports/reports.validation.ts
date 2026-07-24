import { z } from "zod"

import { ItemCondition } from "../../generated/prisma/enums.js"

const booleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true")

export const inventoryReportQuerySchema = {
  query: z
    .object({
      format: z.enum(["json", "csv", "pdf"]).default("json"),
      search: z.string().trim().min(1).max(150).optional(),
      categoryId: z
        .string()
        .uuid("Category ID must be a valid UUID.")
        .optional(),
      condition: z.enum(ItemCondition).optional(),
      isActive: booleanQuery.default(true),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sortBy: z
        .enum([
          "itemName",
          "itemCode",
          "condition",
          "totalQuantity",
          "availableQuantity",
          "createdAt",
          "updatedAt",
        ])
        .default("itemName"),
      sortOrder: z.enum(["asc", "desc"]).default("asc"),
    })
    .strict(),
}

export type InventoryReportQueryInput = z.infer<
  typeof inventoryReportQuerySchema.query
>
