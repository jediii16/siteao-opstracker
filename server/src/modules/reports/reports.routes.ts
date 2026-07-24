import { Router } from "express"

import { UserRole } from "../../generated/prisma/enums.js"
import { authenticate } from "../../middleware/authenticate.js"
import { authorize } from "../../middleware/authorize.js"
import { validateRequest } from "../../middleware/validateRequest.js"
import * as reportsController from "./reports.controller.js"
import { inventoryReportQuerySchema } from "./reports.validation.js"

const reportsRouter = Router()

reportsRouter.get(
  "/inventory",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  validateRequest(inventoryReportQuerySchema),
  reportsController.getInventoryReport,
)

export default reportsRouter
