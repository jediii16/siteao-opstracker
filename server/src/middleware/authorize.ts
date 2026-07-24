import type { NextFunction, Request, Response } from "express"

import type { UserRole } from "../generated/prisma/enums.js"
import { AppError } from "../utils/AppError.js"

export function authorize(...allowedRoles: UserRole[]) {
  return (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    if (!request.user) {
      next(new AppError(401, "Authentication is required."))
      return
    }

    if (!allowedRoles.includes(request.user.role)) {
      next(new AppError(403, "You do not have permission to access this resource."))
      return
    }

    next()
  }
}
