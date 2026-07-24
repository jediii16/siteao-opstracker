import { Router } from "express"

import * as authController from "../controllers/auth.controller.js"
import { authenticate } from "../middleware/authenticate.js"
import { validateRequest } from "../middleware/validateRequest.js"
import { loginSchema } from "../validators/auth.validator.js"

const authRouter = Router()

authRouter.post(
  "/login",
  validateRequest(loginSchema),
  authController.login,
)
authRouter.post("/refresh", authController.refresh)
authRouter.post("/logout", authController.logout)
authRouter.get("/me", authenticate, authController.me)

export default authRouter
