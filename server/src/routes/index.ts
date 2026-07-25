import { Router } from "express"

import authRouter from "./auth.routes.js"
import borrowingRequestRouter from "./borrowing-request.routes.js"
import categoryRouter from "./category.routes.js"
import committeeAccountRouter from "./committee-account.routes.js"
import committeeRouter from "./committee.routes.js"
import dashboardRouter from "../modules/dashboard/dashboard.routes.js"
import healthRouter from "./health.routes.js"
import itemRouter from "./item.routes.js"
import reportsRouter from "../modules/reports/reports.routes.js"
import systemRecordsRouter from "../modules/system-records/system-records.routes.js"
import systemSettingsRouter from "../modules/system-settings/system-settings.routes.js"

const router = Router()

router.use("/auth", authRouter)
router.use("/borrowing-requests", borrowingRequestRouter)
router.use("/categories", categoryRouter)
router.use("/committees", committeeRouter)
router.use("/dashboard", dashboardRouter)
router.use("/health", healthRouter)
router.use("/items", itemRouter)
router.use("/reports", reportsRouter)
router.use("/system-settings", systemSettingsRouter)
router.use("/", systemRecordsRouter)
router.use("/users/committee-accounts", committeeAccountRouter)

export default router
