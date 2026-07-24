import type { LucideIcon } from 'lucide-react'
import {
  Boxes,
  ClipboardClock,
  ClipboardList,
  FileBarChart,
  FolderTree,
  History,
  LayoutDashboard,
  NotebookTabs,
  PackagePlus,
  ShieldCheck,
  Users,
} from 'lucide-react'

import type { UserRole } from '@/context/auth-context'

export interface NavigationItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const navigationByRole: Record<UserRole, NavigationItem[]> = {
  SUPER_ADMIN: [
    { label: 'Dashboard', to: '/logistics/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Inventory', to: '/logistics/inventory', icon: Boxes },
    { label: 'Categories', to: '/logistics/categories', icon: FolderTree },
    { label: 'Borrowing Requests', to: '/logistics/requests', icon: ClipboardList },
    { label: 'Committees & Accounts', to: '/logistics/committees', icon: Users },
    { label: 'Transactions', to: '/logistics/transactions', icon: NotebookTabs },
    { label: 'Reports', to: '/logistics/reports', icon: FileBarChart },
    { label: 'Audit Logs', to: '/logistics/audit-logs', icon: ShieldCheck },
  ],
  COMMITTEE: [
    { label: 'Dashboard', to: '/committee/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Inventory', to: '/committee/inventory', icon: Boxes },
    { label: 'New Borrowing Request', to: '/committee/requests/new', icon: PackagePlus },
    { label: 'My Requests', to: '/committee/requests/history', icon: ClipboardClock },
    { label: 'Borrowing History', to: '/committee/borrowing-history', icon: History },
  ],
}

export function getHomePath(role: UserRole) {
  return role === 'SUPER_ADMIN' ? '/logistics/dashboard' : '/committee/dashboard'
}
