import { Router } from "express"

import { UserRole } from "../../generated/prisma/enums.js"
import { authenticate } from "../../middleware/authenticate.js"
import { authorize } from "../../middleware/authorize.js"
import { validateRequest } from "../../middleware/validateRequest.js"
import * as dashboardController from "./dashboard.controller.js"
import { dashboardQuerySchema } from "./dashboard.validation.js"

const dashboardRouter = Router()

dashboardRouter.get(
  "/",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.COMMITTEE),
  validateRequest(dashboardQuerySchema),
  dashboardController.getDashboard,
)

export default dashboardRouter
