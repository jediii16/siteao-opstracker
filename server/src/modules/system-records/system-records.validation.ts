import { z } from "zod"

import { TransactionType } from "../../generated/prisma/enums.js"

const dateRangeFields = {
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
}

function validateDateRange(
  query: { dateFrom?: string; dateTo?: string },
  context: z.RefinementCtx,
) {
  if (
    query.dateFrom &&
    query.dateTo &&
    query.dateTo < query.dateFrom
  ) {
    context.addIssue({
      code: "custom",
      path: ["dateTo"],
      message: "dateTo must be on or after dateFrom.",
    })
  }
}

export const inventoryTransactionsQuerySchema = {
  query: z
    .object({
      search: z.string().trim().min(1).max(150).optional(),
      transactionType: z.enum(TransactionType).optional(),
      ...dateRangeFields,
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sortBy: z
        .enum(["createdAt", "transactionType", "quantity"])
        .default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict()
    .superRefine(validateDateRange),
}

export const auditLogsQuerySchema = {
  query: z
    .object({
      search: z.string().trim().min(1).max(150).optional(),
      action: z.string().trim().min(1).max(100).optional(),
      entityType: z.string().trim().min(1).max(100).optional(),
      ...dateRangeFields,
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sortBy: z
        .enum(["createdAt", "action", "entityType"])
        .default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict()
    .superRefine(validateDateRange),
}

export type InventoryTransactionsQuery = z.infer<
  typeof inventoryTransactionsQuerySchema.query
>
export type AuditLogsQuery = z.infer<
  typeof auditLogsQuerySchema.query
>
