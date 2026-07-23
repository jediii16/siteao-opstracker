import type { LucideIcon } from 'lucide-react'
import {
  Boxes,
  ClipboardClock,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  NotebookTabs,
  PackagePlus,
  ShieldCheck,
  Users,
} from 'lucide-react'

export interface NavigationItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const logisticsNavigation: NavigationItem[] = [
  { label: 'Dashboard', to: '/logistics/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Inventory', to: '/logistics/inventory', icon: Boxes },
  { label: 'Borrowing Requests', to: '/logistics/requests', icon: ClipboardList },
  { label: 'Categories', to: '/logistics/categories', icon: FolderTree },
  { label: 'Committee Accounts', to: '/logistics/committees', icon: Users },
  { label: 'Transactions', to: '/logistics/transactions', icon: NotebookTabs },
  { label: 'Audit Logs', to: '/logistics/audit-logs', icon: ShieldCheck },
]

export const committeeNavigation: NavigationItem[] = [
  { label: 'Dashboard', to: '/committee/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Inventory', to: '/committee/inventory', icon: Boxes },
  { label: 'Borrow Request', to: '/committee/requests/new', icon: PackagePlus },
  { label: 'Request History', to: '/committee/requests/history', icon: ClipboardClock },
]
