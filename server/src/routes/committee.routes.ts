import { Router } from "express"

import * as committeeController from "../controllers/committee.controller.js"
import { UserRole } from "../generated/prisma/enums.js"
import { authenticate } from "../middleware/authenticate.js"
import { authorize } from "../middleware/authorize.js"
import { validateRequest } from "../middleware/validateRequest.js"
import {
  committeeIdSchema,
  createCommitteeSchema,
  updateCommitteeSchema,
} from "../validators/committee.validation.js"

const committeeRouter = Router()

committeeRouter.use(authenticate, authorize(UserRole.SUPER_ADMIN))

committeeRouter.get("/", committeeController.getCommittees)
committeeRouter.get(
  "/:id",
  validateRequest(committeeIdSchema),
  committeeController.getCommittee,
)
committeeRouter.post(
  "/",
  validateRequest(createCommitteeSchema),
  committeeController.createCommittee,
)
committeeRouter.patch(
  "/:id",
  validateRequest(updateCommitteeSchema),
  committeeController.updateCommittee,
)
committeeRouter.delete(
  "/:id",
  validateRequest(committeeIdSchema),
  committeeController.deactivateCommittee,
)

export default committeeRouter
