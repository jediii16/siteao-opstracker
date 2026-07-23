import { Outlet } from 'react-router-dom'

import { AppSidebar } from '@/components/common/AppSidebar'
import { TopNavbar } from '@/components/common/TopNavbar'
import type { NavigationItem } from '@/lib/navigation'

interface WorkspaceLayoutProps {
  navigation: NavigationItem[]
  workspace: string
}

export function WorkspaceLayout({ navigation, workspace }: WorkspaceLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <AppSidebar navigation={navigation} workspace={workspace} className="fixed inset-y-0 left-0 z-40 hidden md:flex" />
      <div className="md:pl-64">
        <TopNavbar navigation={navigation} workspace={workspace} />
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
