import {
  RequestStatus,
  UserRole,
} from "../../generated/prisma/enums.js"
import { AppError } from "../../utils/AppError.js"
import * as dashboardRepository from "./dashboard.repository.js"
import type {
  DashboardActorContext,
  DashboardQuery,
  MonthBucket,
  RecentActivityDto,
  StatusBucket,
} from "./dashboard.types.js"

const REQUEST_STATUSES = Object.values(RequestStatus)

function utcStartOfToday(now: Date): Date {
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    ),
  )
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function getMonthRange(now: Date, months: number) {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  )
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - months + 1,
      1,
    ),
  )

  return { start, end }
}

export function fillMonthlyBuckets(
  start: Date,
  months: number,
  rows: dashboardRepository.MonthlyRequestCountRow[],
): MonthBucket[] {
  const counts = new Map(
    rows.map((row) => [
      `${row.year}-${row.month}`,
      Number(row.count),
    ]),
  )
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })

  return Array.from({ length: months }, (_, index) => {
    const date = new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth() + index,
        1,
      ),
    )
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth() + 1

    return {
      year,
      month,
      label: formatter.format(date),
      count: counts.get(`${year}-${month}`) ?? 0,
    }
  })
}

function normalizeStatusDistribution(
  rows: Awaited<
    ReturnType<typeof dashboardRepository.getRequestStatusCounts>
  >,
): StatusBucket[] {
  const counts = new Map(
    rows.map((row) => [row.status, row._count.id]),
  )

  return REQUEST_STATUSES.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }))
}

function statusCount(
  distribution: StatusBucket[],
  status: RequestStatus,
): number {
  return (
    distribution.find((entry) => entry.status === status)?.count ??
    0
  )
}

function activeBorrowingCount(
  distribution: StatusBucket[],
): number {
  return dashboardRepository.ACTIVE_BORROWING_STATUSES.reduce(
    (total, status) => total + statusCount(distribution, status),
    0,
  )
}

function safeActivityMessage(description: string): string {
  const normalized = description
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return normalized.length > 300
    ? `${normalized.slice(0, 297)}...`
    : normalized
}

function mapRecentActivity(
  activities: Awaited<
    ReturnType<
      | typeof dashboardRepository.getRecentAuditActivityForAdmin
      | typeof dashboardRepository.getRecentAuditActivityForCommittee
    >
  >,
): RecentActivityDto[] {
  return activities.map((activity) => ({
    id: activity.id,
    action: activity.action,
    message: safeActivityMessage(activity.description),
    entityType: activity.entityType,
    entityId: activity.entityId,
    actor: activity.user,
    committee: activity.committee,
    createdAt: activity.createdAt,
  }))
}

async function requireDashboardActor(
  actor: DashboardActorContext,
) {
  const user = await dashboardRepository.findDashboardActor(
    actor.userId,
  )

  if (!user) {
    throw new AppError(401, "Authenticated user no longer exists.")
  }

  if (!user.isActive || user.role !== actor.role) {
    throw new AppError(403, "Dashboard access is not authorized.")
  }

  if (actor.role === UserRole.SUPER_ADMIN) {
    return {
      user,
      committeeId: undefined,
    }
  }

  if (
    actor.role !== UserRole.COMMITTEE ||
    !actor.committeeId ||
    !user.committeeId ||
    actor.committeeId !== user.committeeId ||
    !user.committee
  ) {
    throw new AppError(
      403,
      "Committee membership is required to view the dashboard.",
    )
  }

  return {
    user,
    committeeId: user.committeeId,
  }
}

export async function getDashboard(
  query: DashboardQuery,
  actor: DashboardActorContext,
) {
  const identity = await requireDashboardActor(actor)
  const now = new Date()
  const todayStart = utcStartOfToday(now)
  const tomorrowStart = addUtcDays(todayStart, 1)
  const { start: monthStart, end: monthEnd } = getMonthRange(
    now,
    query.months,
  )
  const committeeId = identity.committeeId

  const [
    inventory,
    statusRows,
    overdueBorrowings,
    monthlyRows,
    mostBorrowedItems,
    inventoryByCategory,
    recentActivityRows,
  ] = await Promise.all([
    dashboardRepository.getInventorySummary(),
    dashboardRepository.getRequestStatusCounts(committeeId),
    dashboardRepository.countOverdueBorrowings(
      todayStart,
      committeeId,
    ),
    dashboardRepository.getBorrowRequestsByMonth(
      monthStart,
      monthEnd,
      committeeId,
    ),
    dashboardRepository.getMostBorrowedItems(committeeId),
    dashboardRepository.getInventoryByCategory(),
    committeeId
      ? dashboardRepository.getRecentAuditActivityForCommittee(
          actor.userId,
          committeeId,
          query.recentLimit,
        )
      : dashboardRepository.getRecentAuditActivityForAdmin(
          query.recentLimit,
        ),
  ])
  const requestStatusDistribution =
    normalizeStatusDistribution(statusRows)
  const totalInventoryQuantity =
    inventory._sum.totalQuantity ?? 0
  const availableQuantity =
    inventory._sum.availableQuantity ?? 0

  if (committeeId) {
    const [availableInventoryItems, myReturnedRequests] =
      await Promise.all([
        dashboardRepository.countAvailableInventoryItems(),
        dashboardRepository.countReturnedRequests(committeeId),
      ])
    const myTotalRequests = requestStatusDistribution.reduce(
      (total, entry) => total + entry.count,
      0,
    )

    return {
      summary: {
        availableInventoryItems,
        availableQuantity,
        myPendingRequests: statusCount(
          requestStatusDistribution,
          RequestStatus.PENDING,
        ),
        myApprovedOrActiveBorrowings: activeBorrowingCount(
          requestStatusDistribution,
        ),
        myOverdueBorrowings: overdueBorrowings,
        myReturnedRequests,
        myTotalRequests,
      },
      charts: {
        borrowRequestsByMonth: fillMonthlyBuckets(
          monthStart,
          query.months,
          monthlyRows,
        ),
        borrowRequestsByCommittee: [],
        mostBorrowedItems,
        inventoryByCategory,
        requestStatusDistribution,
      },
      recentActivity: mapRecentActivity(recentActivityRows),
      generatedAt: now.toISOString(),
    }
  }

  const [
    returnedToday,
    referenceCounts,
    borrowRequestsByCommittee,
  ] = await Promise.all([
    dashboardRepository.countReturnedToday(
      todayStart,
      tomorrowStart,
    ),
    dashboardRepository.getAdminReferenceCounts(),
    dashboardRepository.getBorrowRequestsByCommittee(
      monthStart,
      monthEnd,
    ),
  ])

  return {
    summary: {
      totalInventoryItems: inventory._count.id,
      totalInventoryQuantity,
      availableQuantity,
      borrowedQuantity: Math.max(
        0,
        totalInventoryQuantity - availableQuantity,
      ),
      pendingRequests: statusCount(
        requestStatusDistribution,
        RequestStatus.PENDING,
      ),
      approvedOrActiveBorrowings: activeBorrowingCount(
        requestStatusDistribution,
      ),
      overdueBorrowings,
      returnedToday,
      ...referenceCounts,
    },
    charts: {
      borrowRequestsByMonth: fillMonthlyBuckets(
        monthStart,
        query.months,
        monthlyRows,
      ),
      borrowRequestsByCommittee,
      mostBorrowedItems,
      inventoryByCategory,
      requestStatusDistribution,
    },
    recentActivity: mapRecentActivity(recentActivityRows),
    generatedAt: now.toISOString(),
  }
}
