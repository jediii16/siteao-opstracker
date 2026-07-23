import { Box } from 'lucide-react'
import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Box className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold">SITEAO OpsTracker</p>
              <p className="text-xs text-muted-foreground">Operations management workspace</p>
            </div>
          </div>
          <Outlet />
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.55_0.2_260_/_0.32),transparent_45%)]" />
        <div className="relative max-w-xl">
          <p className="mb-3 text-sm font-medium text-blue-300">SITEAO OPERATIONS</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            One workspace for accountable inventory operations.
          </h1>
          <p className="mt-4 text-slate-400">
            A polished frontend foundation prepared for logistics and committee workflows.
          </p>
        </div>
      </section>
    </main>
  )
}
