import { Box, ChevronsUpDown } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { NavigationItem } from '@/lib/navigation'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  navigation: NavigationItem[]
  workspace: string
  className?: string
  onNavigate?: () => void
}

export function AppSidebar({ navigation, workspace, className, onNavigate }: AppSidebarProps) {
  return (
    <aside className={cn('flex h-full w-64 flex-col bg-slate-950 text-slate-100', className)}>
      <div className="flex h-16 items-center gap-3 px-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-950/30">
          <Box className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">SITEAO</p>
          <p className="truncate text-xs text-slate-400">OpsTracker</p>
        </div>
      </div>
      <Separator className="bg-slate-800" />
      <div className="px-3 py-4">
        <Badge className="mb-3 border-slate-700 bg-slate-900 text-slate-300">{workspace}</Badge>
        <nav aria-label={`${workspace} navigation`} className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-white',
                  isActive && 'bg-blue-500/15 text-blue-300',
                )
              }
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-3">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between px-3 py-2.5 text-left text-slate-300 hover:bg-slate-900 hover:text-white"
        >
          <span>
            <span className="block text-sm font-medium">SITEAO Workspace</span>
            <span className="block text-xs text-slate-500">Frontend foundation</span>
          </span>
          <ChevronsUpDown className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </aside>
  )
}
