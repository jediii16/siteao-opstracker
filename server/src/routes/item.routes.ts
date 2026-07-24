import { Router } from "express"

import * as itemController from "../controllers/item.controller.js"
import { UserRole } from "../generated/prisma/enums.js"
import { authenticate } from "../middleware/authenticate.js"
import { authorize } from "../middleware/authorize.js"
import { validateRequest } from "../middleware/validateRequest.js"
import { itemBorrowingHistorySchema } from "../validators/borrowing-request.validation.js"
import {
  createItemSchema,
  itemIdSchema,
  listItemsSchema,
  updateItemSchema,
} from "../validators/item.validation.js"

const itemRouter = Router()
const allowAuthenticatedRoles = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.COMMITTEE,
)
const allowSuperAdmin = authorize(UserRole.SUPER_ADMIN)

itemRouter.use(authenticate)

itemRouter.get(
  "/",
  allowAuthenticatedRoles,
  validateRequest(listItemsSchema),
  itemController.getItems,
)
itemRouter.get(
  "/:id/history",
  allowAuthenticatedRoles,
  validateRequest(itemBorrowingHistorySchema),
  itemController.getItemBorrowingHistory,
)
itemRouter.get(
  "/:id",
  allowAuthenticatedRoles,
  validateRequest(itemIdSchema),
  itemController.getItem,
)
itemRouter.post(
  "/",
  allowSuperAdmin,
  validateRequest(createItemSchema),
  itemController.createItem,
)
itemRouter.patch(
  "/:id",
  allowSuperAdmin,
  validateRequest(updateItemSchema),
  itemController.updateItem,
)
itemRouter.delete(
  "/:id",
  allowSuperAdmin,
  validateRequest(itemIdSchema),
  itemController.deactivateItem,
)

export default itemRouter
