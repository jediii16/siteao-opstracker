import { Box } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { AuthUser } from '@/context/auth-context'
import type { NavigationItem } from '@/lib/navigation'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  navigation: NavigationItem[]
  user: AuthUser
  className?: string
  onNavigate?: () => void
}

export function AppSidebar({ navigation, user, className, onNavigate }: AppSidebarProps) {
  const workspace = user.role === 'SUPER_ADMIN' ? 'Administration' : 'Committee'

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground',
        className,
      )}
    >
      <div className="h-1 brand-gradient-primary" aria-hidden="true" />
      <div className="flex h-16 items-center gap-3 px-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Box className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-bold tracking-tight">SITEAO</p>
          <p className="truncate text-xs text-muted-foreground">OpsTracker</p>
        </div>
      </div>
      <Separator />
      <div className="px-3 py-4">
        <p className="mb-3 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {workspace}
        </p>
        <nav aria-label={`${workspace} navigation`} className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  isActive &&
                    'bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary',
                )
              }
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t border-border p-4">
        <p className="truncate text-sm font-semibold">{user.username}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {user.committee?.name ?? 'SITEAO Operations'}
        </p>
        <Badge variant="secondary" className="mt-2">
          {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Committee'}
        </Badge>
      </div>
    </aside>
  )
}
