import type { NextFunction, Request, Response } from "express"
import type { ZodType } from "zod"

interface RequestSchemas {
  body?: ZodType
  params?: ZodType
  query?: ZodType
}

export function validateRequest(schemas: RequestSchemas) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    for (const source of ["body", "params", "query"] as const) {
      const schema = schemas[source]

      if (!schema) {
        continue
      }

      const result = schema.safeParse(request[source])

      if (!result.success) {
        response.status(400).json({
          success: false,
          message: "Request validation failed.",
          errors: result.error.issues.map((issue) => ({
            path: [source, ...issue.path].join("."),
            message: issue.message,
          })),
        })
        return
      }

      if (source === "body") {
        request.body = result.data
      } else if (source === "query") {
        Object.defineProperty(request, "query", {
          configurable: true,
          enumerable: true,
          value: result.data,
        })
      } else {
        Object.assign(request[source], result.data)
      }
    }

    next()
  }
}
