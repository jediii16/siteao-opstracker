import { Router } from "express"

import * as categoryController from "../controllers/category.controller.js"
import { UserRole } from "../generated/prisma/enums.js"
import { authenticate } from "../middleware/authenticate.js"
import { authorize } from "../middleware/authorize.js"
import { validateRequest } from "../middleware/validateRequest.js"
import {
  categoryIdSchema,
  createCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
} from "../validators/category.validation.js"

const categoryRouter = Router()
const allowAuthenticatedRoles = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.COMMITTEE,
)
const allowSuperAdmin = authorize(UserRole.SUPER_ADMIN)

categoryRouter.use(authenticate)

categoryRouter.get(
  "/",
  allowAuthenticatedRoles,
  validateRequest(listCategoriesSchema),
  categoryController.getCategories,
)
categoryRouter.get(
  "/:id",
  allowAuthenticatedRoles,
  validateRequest(categoryIdSchema),
  categoryController.getCategory,
)
categoryRouter.post(
  "/",
  allowSuperAdmin,
  validateRequest(createCategorySchema),
  categoryController.createCategory,
)
categoryRouter.patch(
  "/:id",
  allowSuperAdmin,
  validateRequest(updateCategorySchema),
  categoryController.updateCategory,
)
categoryRouter.delete(
  "/:id",
  allowSuperAdmin,
  validateRequest(categoryIdSchema),
  categoryController.deactivateCategory,
)

export default categoryRouter
