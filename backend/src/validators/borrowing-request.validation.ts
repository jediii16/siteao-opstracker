import { z } from "zod"

import {
  RequestStatus,
  ReturnCondition,
} from "../generated/prisma/enums.js"

const requestItem = z
  .object({
    itemId: z.string().uuid("Item ID must be a valid UUID."),
    quantity: z.number().int().min(1),
  })
  .strict()

export const createBorrowingRequestSchema = {
  body: z
    .object({
      requesterName: z.string().trim().min(2).max(150),
      requesterPosition: z.string().trim().min(2).max(100),
      purpose: z.string().trim().min(5).max(5000),
      borrowDate: z.iso.date(),
      expectedReturnDate: z.iso.date(),
      additionalNotes: z.string().trim().max(5000).nullable().optional(),
      items: z.array(requestItem).min(1).max(50),
    })
    .strict()
    .superRefine((body, context) => {
      if (body.expectedReturnDate < body.borrowDate) {
        context.addIssue({
          code: "custom",
          path: ["expectedReturnDate"],
          message:
            "Expected return date must be on or after the borrow date.",
        })
      }
    }),
}

export const borrowingRequestIdSchema = {
  params: z
    .object({
      id: z.string().uuid("Borrowing request ID must be a valid UUID."),
    })
    .strict(),
}

export const listMyBorrowingRequestsSchema = {
  query: z
    .object({
      status: z.enum(RequestStatus).optional(),
      search: z.string().trim().min(1).max(150).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sortBy: z
        .enum([
          "createdAt",
          "updatedAt",
          "borrowDate",
          "expectedReturnDate",
          "status",
        ])
        .default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict(),
}

export const listAllBorrowingRequestsSchema = {
  query: z
    .object({
      status: z.enum(RequestStatus).optional(),
      committeeId: z
        .string()
        .uuid("Committee ID must be a valid UUID.")
        .optional(),
      search: z.string().trim().min(1).max(150).optional(),
      borrowDateFrom: z.iso.date().optional(),
      borrowDateTo: z.iso.date().optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sortBy: z
        .enum([
          "createdAt",
          "updatedAt",
          "borrowDate",
          "expectedReturnDate",
          "status",
        ])
        .default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict()
    .superRefine((query, context) => {
      if (
        query.borrowDateFrom &&
        query.borrowDateTo &&
        query.borrowDateTo < query.borrowDateFrom
      ) {
        context.addIssue({
          code: "custom",
          path: ["borrowDateTo"],
          message:
            "borrowDateTo must be on or after borrowDateFrom.",
        })
      }
    }),
}

export const approveBorrowingRequestSchema = {
  params: borrowingRequestIdSchema.params,
  body: z.preprocess(
    (value) => value ?? {},
    z
      .object({
        remarks: z.string().trim().max(5000).optional(),
      })
      .strict(),
  ),
}

export const rejectBorrowingRequestSchema = {
  params: borrowingRequestIdSchema.params,
  body: z
    .object({
      reason: z.string().trim().min(5).max(5000),
    })
    .strict(),
}

export const returnBorrowingRequestSchema = {
  params: borrowingRequestIdSchema.params,
  body: z
    .object({
      condition: z.enum(ReturnCondition),
      notes: z.string().trim().max(5000).nullable().optional(),
    })
    .strict(),
}

const dateOrDateTime = z.union([
  z.iso.date(),
  z.iso.datetime({ offset: true }),
])

export const borrowingHistorySchema = {
  query: z
    .object({
      status: z.enum(RequestStatus).optional(),
      committeeId: z
        .string()
        .uuid("Committee ID must be a valid UUID.")
        .optional(),
      itemId: z.string().uuid("Item ID must be a valid UUID.").optional(),
      search: z.string().trim().min(1).max(150).optional(),
      borrowDateFrom: z.iso.date().optional(),
      borrowDateTo: z.iso.date().optional(),
      returnedFrom: dateOrDateTime.optional(),
      returnedTo: dateOrDateTime.optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sortBy: z
        .enum([
          "createdAt",
          "borrowDate",
          "expectedReturnDate",
          "returnedAt",
          "updatedAt",
          "status",
        ])
        .default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict()
    .superRefine((query, context) => {
      if (
        query.borrowDateFrom &&
        query.borrowDateTo &&
        query.borrowDateTo < query.borrowDateFrom
      ) {
        context.addIssue({
          code: "custom",
          path: ["borrowDateTo"],
          message:
            "borrowDateTo must be on or after borrowDateFrom.",
        })
      }

      if (
        query.returnedFrom &&
        query.returnedTo &&
        new Date(query.returnedTo) < new Date(query.returnedFrom)
      ) {
        context.addIssue({
          code: "custom",
          path: ["returnedTo"],
          message: "returnedTo must be on or after returnedFrom.",
        })
      }
    }),
}

export const itemBorrowingHistorySchema = {
  params: z
    .object({
      id: z.string().uuid("Item ID must be a valid UUID."),
    })
    .strict(),
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .strict(),
}

export type CreateBorrowingRequestInput = z.infer<
  typeof createBorrowingRequestSchema.body
>
export type ListMyBorrowingRequestsQuery = z.infer<
  typeof listMyBorrowingRequestsSchema.query
>
export type ListAllBorrowingRequestsQuery = z.infer<
  typeof listAllBorrowingRequestsSchema.query
>
export type ApproveBorrowingRequestInput = z.infer<
  typeof approveBorrowingRequestSchema.body
>
export type RejectBorrowingRequestInput = z.infer<
  typeof rejectBorrowingRequestSchema.body
>
export type ReturnBorrowingRequestInput = z.infer<
  typeof returnBorrowingRequestSchema.body
>
export type BorrowingHistoryQuery = z.infer<
  typeof borrowingHistorySchema.query
>
export type ItemBorrowingHistoryQuery = z.infer<
  typeof itemBorrowingHistorySchema.query
>
