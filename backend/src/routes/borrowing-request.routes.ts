import { Router } from "express"

import * as borrowingRequestController from "../controllers/borrowing-request.controller.js"
import { UserRole } from "../generated/prisma/enums.js"
import { authenticate } from "../middleware/authenticate.js"
import { authorize } from "../middleware/authorize.js"
import { validateRequest } from "../middleware/validateRequest.js"
import {
  approveBorrowingRequestSchema,
  borrowingHistorySchema,
  borrowingRequestIdSchema,
  createBorrowingRequestSchema,
  listAllBorrowingRequestsSchema,
  listMyBorrowingRequestsSchema,
  rejectBorrowingRequestSchema,
  returnBorrowingRequestSchema,
} from "../validators/borrowing-request.validation.js"

const borrowingRequestRouter = Router()

borrowingRequestRouter.use(authenticate)

borrowingRequestRouter.post(
  "/",
  authorize(UserRole.COMMITTEE),
  validateRequest(createBorrowingRequestSchema),
  borrowingRequestController.createBorrowingRequest,
)
borrowingRequestRouter.get(
  "/",
  authorize(UserRole.SUPER_ADMIN),
  validateRequest(listAllBorrowingRequestsSchema),
  borrowingRequestController.getAllBorrowingRequests,
)
borrowingRequestRouter.get(
  "/history",
  authorize(UserRole.SUPER_ADMIN, UserRole.COMMITTEE),
  validateRequest(borrowingHistorySchema),
  borrowingRequestController.getBorrowingHistory,
)
borrowingRequestRouter.get(
  "/my",
  authorize(UserRole.COMMITTEE),
  validateRequest(listMyBorrowingRequestsSchema),
  borrowingRequestController.getMyBorrowingRequests,
)
borrowingRequestRouter.patch(
  "/:id/approve",
  authorize(UserRole.SUPER_ADMIN),
  validateRequest(approveBorrowingRequestSchema),
  borrowingRequestController.approveBorrowingRequest,
)
borrowingRequestRouter.patch(
  "/:id/reject",
  authorize(UserRole.SUPER_ADMIN),
  validateRequest(rejectBorrowingRequestSchema),
  borrowingRequestController.rejectBorrowingRequest,
)
borrowingRequestRouter.patch(
  "/:id/return",
  authorize(UserRole.SUPER_ADMIN),
  validateRequest(returnBorrowingRequestSchema),
  borrowingRequestController.returnBorrowingRequest,
)
borrowingRequestRouter.get(
  "/:id",
  authorize(UserRole.SUPER_ADMIN, UserRole.COMMITTEE),
  validateRequest(borrowingRequestIdSchema),
  borrowingRequestController.getBorrowingRequest,
)

export default borrowingRequestRouter
