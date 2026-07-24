import { Router } from "express"

import * as committeeAccountController from "../controllers/committee-account.controller.js"
import { UserRole } from "../generated/prisma/enums.js"
import { authenticate } from "../middleware/authenticate.js"
import { authorize } from "../middleware/authorize.js"
import { validateRequest } from "../middleware/validateRequest.js"
import {
  createCommitteeAccountSchema,
  resetCommitteeAccountPasswordSchema,
  updateCommitteeAccountSchema,
  updateCommitteeAccountStatusSchema,
} from "../validators/committee-account.validation.js"

const committeeAccountRouter = Router()

committeeAccountRouter.use(
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
)

committeeAccountRouter.get(
  "/",
  committeeAccountController.getCommitteeAccounts,
)
committeeAccountRouter.post(
  "/",
  validateRequest(createCommitteeAccountSchema),
  committeeAccountController.createCommitteeAccount,
)
committeeAccountRouter.patch(
  "/:id",
  validateRequest(updateCommitteeAccountSchema),
  committeeAccountController.updateCommitteeAccount,
)
committeeAccountRouter.post(
  "/:id/reset-password",
  validateRequest(resetCommitteeAccountPasswordSchema),
  committeeAccountController.resetCommitteeAccountPassword,
)
committeeAccountRouter.patch(
  "/:id/status",
  validateRequest(updateCommitteeAccountStatusSchema),
  committeeAccountController.updateCommitteeAccountStatus,
)

export default committeeAccountRouter
