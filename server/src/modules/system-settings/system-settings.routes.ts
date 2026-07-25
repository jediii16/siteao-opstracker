import { Router } from "express"

import { UserRole } from "../../generated/prisma/enums.js"
import { authenticate } from "../../middleware/authenticate.js"
import { authorize } from "../../middleware/authorize.js"
import { validateRequest } from "../../middleware/validateRequest.js"
import * as systemSettingsController from "./system-settings.controller.js"
import { updateSystemSettingsSchema } from "./system-settings.validation.js"

const systemSettingsRouter = Router()

systemSettingsRouter.use(
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
)

systemSettingsRouter.get(
  "/",
  systemSettingsController.getSystemSettings,
)
systemSettingsRouter.patch(
  "/",
  validateRequest(updateSystemSettingsSchema),
  systemSettingsController.updateSystemSettings,
)

export default systemSettingsRouter
