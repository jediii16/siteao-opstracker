import type {
  RequestStatus,
  UserRole,
} from "../../generated/prisma/enums.js"

export interface DashboardActorContext {
  userId: string
  role: UserRole
  committeeId: string | null
}

export interface DashboardQuery {
  months: number
  recentLimit: number
}

export interface MonthBucket {
  year: number
  month: number
  label: string
  count: number
}

export interface StatusBucket {
  status: RequestStatus
  count: number
}

export interface RecentActivityDto {
  id: string
  action: string
  message: string
  entityType: string
  entityId: string | null
  actor: {
    id: string
    username: string
  } | null
  committee: {
    id: string
    name: string
  } | null
  createdAt: Date
}
