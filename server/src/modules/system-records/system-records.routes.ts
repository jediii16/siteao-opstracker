import { Router } from "express"

import { UserRole } from "../../generated/prisma/enums.js"
import { authenticate } from "../../middleware/authenticate.js"
import { authorize } from "../../middleware/authorize.js"
import { validateRequest } from "../../middleware/validateRequest.js"
import * as systemRecordsController from "./system-records.controller.js"
import {
  auditLogsQuerySchema,
  inventoryTransactionsQuerySchema,
} from "./system-records.validation.js"

const systemRecordsRouter = Router()

systemRecordsRouter.get(
  "/inventory-transactions",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  validateRequest(inventoryTransactionsQuerySchema),
  systemRecordsController.getInventoryTransactions,
)

systemRecordsRouter.get(
  "/audit-logs",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  validateRequest(auditLogsQuerySchema),
  systemRecordsController.getAuditLogs,
)

export default systemRecordsRouter
