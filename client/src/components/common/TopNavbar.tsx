import { Bell, Menu, Search } from 'lucide-react'
import { useState } from 'react'

import { AppSidebar } from '@/components/common/AppSidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { NavigationItem } from '@/lib/navigation'
import { getInitials } from '@/utils/getInitials'

interface TopNavbarProps {
  navigation: NavigationItem[]
  workspace: string
}

export function TopNavbar({ navigation, workspace }: TopNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" size="icon" className="md:hidden" aria-label="Open navigation">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 border-0 p-0">
          <SheetTitle className="sr-only">SITEAO navigation</SheetTitle>
          <AppSidebar navigation={navigation} workspace={workspace} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="relative hidden w-full max-w-sm sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search" placeholder="Search OpsTracker..." className="pl-9" disabled />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" className="gap-2 px-2">
              <Avatar className="size-8">
                <AvatarFallback>{getInitials(workspace)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium lg:inline">{workspace}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Workspace placeholder</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Profile</DropdownMenuItem>
            <DropdownMenuItem disabled>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
