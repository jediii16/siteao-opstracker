import cors from "cors"
import express from "express"
import helmet from "helmet"
import morgan from "morgan"

import { env } from "./config/env.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { notFoundHandler } from "./middleware/notFoundHandler.js"
import routes from "./routes/index.js"

const app = express()

app.disable("x-powered-by")

app.use(helmet())

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

app.use("/api", routes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app