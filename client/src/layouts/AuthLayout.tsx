import { Box, CheckCircle2 } from 'lucide-react'
import { Outlet } from 'react-router-dom'

import { ThemeToggle } from '@/components/common/ThemeToggle'

export function AuthLayout() {
  return (
    <main className="relative grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)]">
      <div className="absolute inset-x-0 top-0 z-10 h-1 brand-gradient-primary" aria-hidden="true" />
      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Box className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-heading font-bold tracking-tight">SITEAO OpsTracker</p>
                <p className="text-xs text-muted-foreground">Inventory operations workspace</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <Outlet />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Authorized SITEAO accounts only
          </p>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-brand-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_80%_12%,rgba(72,173,191,0.34),transparent_38%)]"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-brand-light-blue">
            SITEAO Operations
          </p>
        </div>
        <div className="relative max-w-xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Accountable operations, from inventory to return.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-blue-100/75">
            A focused workspace for SITEAO administrators and committees to coordinate equipment
            access responsibly.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-blue-50/90 sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-brand-light-blue" aria-hidden="true" />
              Role-aware access
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-brand-light-blue" aria-hidden="true" />
              Secure session refresh
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
