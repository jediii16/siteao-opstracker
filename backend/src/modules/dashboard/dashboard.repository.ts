import { prisma } from "../../config/prisma.js"
import {
  Prisma,
  RequestStatus,
  UserRole,
} from "../../generated/prisma/client.js"

export const ACTIVE_BORROWING_STATUSES = [
  RequestStatus.APPROVED,
  RequestStatus.BORROWED,
] as const

export const COMPLETED_BORROWING_STATUSES = [
  RequestStatus.APPROVED,
  RequestStatus.BORROWED,
  RequestStatus.RETURNED,
] as const

const ADMIN_ACTIVITY_ACTIONS = [
  "BORROWING_REQUEST_CREATED",
  "BORROWING_REQUEST_APPROVED",
  "BORROWING_REQUEST_REJECTED",
  "BORROWING_REQUEST_RETURNED",
  "ITEM_CREATED",
  "ITEM_UPDATED",
  "ITEM_QUANTITY_UPDATED",
  "ITEM_DEACTIVATED",
  "ITEM_ACTIVATED",
  "CATEGORY_CREATED",
  "CATEGORY_UPDATED",
  "CATEGORY_DEACTIVATED",
  "CATEGORY_ACTIVATED",
  "COMMITTEE_CREATED",
  "COMMITTEE_UPDATED",
  "COMMITTEE_DEACTIVATED",
  "COMMITTEE_ACCOUNT_CREATED",
  "COMMITTEE_ACCOUNT_UPDATED",
  "COMMITTEE_ACCOUNT_ACTIVATED",
  "COMMITTEE_ACCOUNT_DEACTIVATED",
  "SYSTEM_SETTINGS_UPDATED",
] as const

const BORROWING_ACTIVITY_ACTIONS = [
  "BORROWING_REQUEST_CREATED",
  "BORROWING_REQUEST_APPROVED",
  "BORROWING_REQUEST_REJECTED",
  "BORROWING_REQUEST_RETURNED",
] as const

const PUBLIC_CATALOG_ACTIVITY_ACTIONS = [
  "ITEM_CREATED",
  "ITEM_UPDATED",
  "ITEM_QUANTITY_UPDATED",
  "ITEM_DEACTIVATED",
  "ITEM_ACTIVATED",
  "CATEGORY_CREATED",
  "CATEGORY_UPDATED",
  "CATEGORY_DEACTIVATED",
  "CATEGORY_ACTIVATED",
] as const

export interface MonthlyRequestCountRow {
  year: number
  month: number
  count: bigint
}

export function findDashboardActor(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      committeeId: true,
      committee: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
  })
}

export function getInventorySummary() {
  return prisma.item.aggregate({
    where: { isActive: true },
    _count: { id: true },
    _sum: {
      totalQuantity: true,
      availableQuantity: true,
    },
  })
}

export function countAvailableInventoryItems() {
  return prisma.item.count({
    where: {
      isActive: true,
      availableQuantity: { gt: 0 },
    },
  })
}

export function getRequestStatusCounts(committeeId?: string) {
  return prisma.borrowingRequest.groupBy({
    by: ["status"],
    where:
      committeeId === undefined ? undefined : { committeeId },
    _count: { id: true },
  })
}

export function countOverdueBorrowings(
  todayStart: Date,
  committeeId?: string,
) {
  return prisma.borrowingRequest.count({
    where: {
      committeeId:
        committeeId === undefined ? undefined : committeeId,
      status: { in: [...ACTIVE_BORROWING_STATUSES] },
      expectedReturnDate: { lt: todayStart },
    },
  })
}

export function countReturnedToday(
  todayStart: Date,
  tomorrowStart: Date,
  committeeId?: string,
) {
  return prisma.borrowingRequest.count({
    where: {
      committeeId:
        committeeId === undefined ? undefined : committeeId,
      status: RequestStatus.RETURNED,
      returnedAt: {
        gte: todayStart,
        lt: tomorrowStart,
      },
    },
  })
}

export function countReturnedRequests(committeeId: string) {
  return prisma.borrowingRequest.count({
    where: {
      committeeId,
      status: RequestStatus.RETURNED,
    },
  })
}

export async function getAdminReferenceCounts() {
  const [activeCommittees, activeCommitteeAccounts, activeCategories] =
    await Promise.all([
      prisma.committee.count({ where: { isActive: true } }),
      prisma.user.count({
        where: {
          isActive: true,
          role: UserRole.COMMITTEE,
        },
      }),
      prisma.category.count({ where: { isActive: true } }),
    ])

  return {
    activeCommittees,
    activeCommitteeAccounts,
    activeCategories,
  }
}

export function getBorrowRequestsByMonth(
  start: Date,
  end: Date,
  committeeId?: string,
) {
  if (committeeId) {
    return prisma.$queryRaw<MonthlyRequestCountRow[]>(Prisma.sql`
      SELECT
        EXTRACT(YEAR FROM "created_at")::int AS "year",
        EXTRACT(MONTH FROM "created_at")::int AS "month",
        COUNT(*)::bigint AS "count"
      FROM "borrowing_requests"
      WHERE "created_at" >= ${start}
        AND "created_at" < ${end}
        AND "committee_id" = ${committeeId}::uuid
      GROUP BY 1, 2
      ORDER BY 1, 2
    `)
  }

  return prisma.$queryRaw<MonthlyRequestCountRow[]>(Prisma.sql`
    SELECT
      EXTRACT(YEAR FROM "created_at")::int AS "year",
      EXTRACT(MONTH FROM "created_at")::int AS "month",
      COUNT(*)::bigint AS "count"
    FROM "borrowing_requests"
    WHERE "created_at" >= ${start}
      AND "created_at" < ${end}
    GROUP BY 1, 2
    ORDER BY 1, 2
  `)
}

export async function getBorrowRequestsByCommittee(
  start: Date,
  end: Date,
) {
  const counts = await prisma.borrowingRequest.groupBy({
    by: ["committeeId"],
    where: {
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    _count: { id: true },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 10,
  })
  const committees = await prisma.committee.findMany({
    where: {
      id: { in: counts.map((entry) => entry.committeeId) },
    },
    select: {
      id: true,
      name: true,
    },
  })
  const committeeNames = new Map(
    committees.map((committee) => [
      committee.id,
      committee.name,
    ]),
  )

  return counts.map((entry) => ({
    committeeId: entry.committeeId,
    committeeName:
      committeeNames.get(entry.committeeId) ?? "Unknown committee",
    count: entry._count.id,
  }))
}

export async function getMostBorrowedItems(committeeId?: string) {
  const aggregates = await prisma.borrowingRequestItem.groupBy({
    by: ["itemId"],
    where: {
      borrowingRequest: {
        committeeId:
          committeeId === undefined ? undefined : committeeId,
        status: {
          in: [...COMPLETED_BORROWING_STATUSES],
        },
      },
    },
    _sum: {
      quantityApproved: true,
    },
    _count: {
      borrowingRequestId: true,
    },
    orderBy: {
      _sum: {
        quantityApproved: "desc",
      },
    },
    take: 10,
  })
  const items = await prisma.item.findMany({
    where: {
      id: { in: aggregates.map((entry) => entry.itemId) },
    },
    select: {
      id: true,
      itemCode: true,
      itemName: true,
    },
  })
  const itemsById = new Map(items.map((item) => [item.id, item]))

  return aggregates.flatMap((entry) => {
    const item = itemsById.get(entry.itemId)

    return item
      ? [
          {
            itemId: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            totalBorrowedQuantity:
              entry._sum.quantityApproved ?? 0,
            requestCount: entry._count.borrowingRequestId,
          },
        ]
      : []
  })
}

export async function getInventoryByCategory() {
  const aggregates = await prisma.item.groupBy({
    by: ["categoryId"],
    where: {
      isActive: true,
      category: {
        isActive: true,
      },
    },
    _count: { id: true },
    _sum: {
      totalQuantity: true,
      availableQuantity: true,
    },
  })
  const categories = await prisma.category.findMany({
    where: {
      id: { in: aggregates.map((entry) => entry.categoryId) },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  })
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  )

  return aggregates
    .flatMap((entry) => {
      const categoryName = categoryNames.get(entry.categoryId)

      return categoryName
        ? [
            {
              categoryId: entry.categoryId,
              categoryName,
              itemCount: entry._count.id,
              totalQuantity: entry._sum.totalQuantity ?? 0,
              availableQuantity:
                entry._sum.availableQuantity ?? 0,
            },
          ]
        : []
    })
    .sort((left, right) =>
      left.categoryName.localeCompare(right.categoryName),
    )
}

const recentActivitySelect = {
  id: true,
  action: true,
  description: true,
  entityType: true,
  entityId: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      username: true,
    },
  },
  committee: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.AuditLogSelect

export function getRecentAuditActivityForAdmin(limit: number) {
  return prisma.auditLog.findMany({
    where: {
      action: { in: [...ADMIN_ACTIVITY_ACTIONS] },
    },
    select: recentActivitySelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}

export function getRecentAuditActivityForCommittee(
  userId: string,
  committeeId: string,
  limit: number,
) {
  return prisma.auditLog.findMany({
    where: {
      action: {
        in: [
          ...BORROWING_ACTIVITY_ACTIONS,
          ...PUBLIC_CATALOG_ACTIVITY_ACTIONS,
        ],
      },
      OR: [
        {
          action: { in: [...BORROWING_ACTIVITY_ACTIONS] },
          committeeId,
        },
        {
          action: { in: [...BORROWING_ACTIVITY_ACTIONS] },
          userId,
        },
        {
          action: {
            in: [...PUBLIC_CATALOG_ACTIVITY_ACTIONS],
          },
        },
      ],
    },
    select: recentActivitySelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}
