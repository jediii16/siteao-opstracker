import { PackageCheck } from 'lucide-react'
import { Outlet } from 'react-router-dom'

import logisHeads from '@/assets/logis-heads.png'
import { ThemeToggle } from '@/components/common/ThemeToggle'

export function AuthLayout() {
  return (
    <main className="relative grid min-h-screen w-full min-w-0 max-w-full overflow-x-clip overflow-y-hidden bg-background lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <div className="absolute inset-x-0 top-0 z-10 h-1 brand-gradient-primary" aria-hidden="true" />
      <section className="auth-layout-section auth-panel-surface relative flex min-w-0 items-center justify-center px-5 py-10 sm:px-8 lg:py-12">
        <div
          className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-primary/5 blur-3xl"
          aria-hidden="true"
        />
        <div className="auth-layout-shell relative w-full max-w-md">
          <div className="auth-brand-row mb-9 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="group/brandmark flex size-11 items-center justify-center rounded-xl border border-primary/40 bg-gradient-to-br from-brand-navy via-[#7a2a16] to-primary text-white shadow-[0_8px_22px_rgba(217,54,0,0.2)] transition-[box-shadow,border-color] duration-300 hover:border-[#ff7547]/70 hover:shadow-[0_10px_28px_rgba(255,106,56,0.3)]">
                <PackageCheck
                  className="size-5 transition-transform duration-300 ease-out group-hover/brandmark:-rotate-6 group-hover/brandmark:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </span>
              <div>
                <p className="font-heading text-base font-bold tracking-tight">
                  SITEAO OpsTracker
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  By the Logistics Team
                </p>
              </div>
            </div>
            <div className="[&_button]:rounded-full [&_button]:border [&_button]:border-border/60 [&_button]:bg-card/60 [&_button]:shadow-sm [&_button]:transition-all [&_button]:duration-200 [&_button:hover]:-translate-y-0.5 [&_button:hover]:border-primary/30 [&_button:hover]:shadow-md [&_button:active]:translate-y-0 [&_svg]:transition-transform [&_svg]:duration-200 [&_button:hover_svg]:rotate-12">
              <ThemeToggle />
            </div>
          </div>
          <Outlet />
          <div className="auth-footer mt-6 space-y-1 text-center text-xs text-muted-foreground">
            <p>Authorized SITEAO accounts only</p>
            <p className="lg:hidden">Developed by Jed Tenorio</p>
          </div>
        </div>
      </section>
      <section className="auth-hero-surface relative hidden min-h-screen min-w-0 self-stretch overflow-hidden text-white lg:block">
        <div
          className="absolute inset-0 opacity-80 [background:radial-gradient(circle_at_75%_16%,rgba(72,173,191,0.34),transparent_38%)]"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-40 -right-32 size-[30rem] rounded-full bg-primary/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="absolute left-10 top-12 z-20 xl:left-14">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-brand-light-blue">
            SITEAO Operations Tracker
          </p>
        </div>

        <div className="group/portrait absolute -bottom-12 left-1/2 z-10 w-[108%] max-w-none -translate-x-1/2 overflow-hidden">
          <img
            src={logisHeads}
            alt="SITEAO Logistics Team"
            className="w-full object-contain drop-shadow-2xl"
          />
          <span
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 blur-sm mix-blend-screen transition-[transform,opacity] duration-1000 ease-out group-hover/portrait:translate-x-[700%] group-hover/portrait:opacity-100 motion-reduce:hidden"
            aria-hidden="true"
          />
        </div>

        <div className="absolute inset-x-8 bottom-20 z-20 text-center xl:inset-x-12">
          <h1 className="group/title relative inline-flex overflow-hidden whitespace-nowrap rounded-2xl bg-brand-navy/55 px-6 py-3 text-[clamp(1.25rem,2.05vw,2.25rem)] font-extrabold leading-tight tracking-tight shadow-2xl shadow-black/25 ring-1 ring-white/10 backdrop-blur-[2px] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.015] hover:bg-brand-navy/70 hover:shadow-[0_18px_45px_rgba(0,0,0,0.35),0_0_30px_rgba(255,117,71,0.18)] hover:ring-[#ff7547]/30 motion-reduce:transform-none motion-reduce:transition-none">
            <span
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover/title:translate-x-[500%] motion-reduce:hidden"
              aria-hidden="true"
            />
            <span className="relative z-10 text-[#ff7547] transition-[filter] duration-300 group-hover/title:drop-shadow-[0_0_10px_rgba(255,117,71,0.65)]">
              SITEAO&apos;s
            </span>
            <span className="relative z-10">&nbsp;Inventory and Borrowing System</span>
          </h1>
        </div>

        <div className="absolute inset-x-10 bottom-5 z-20 flex items-center justify-between text-xs text-blue-100/65 xl:inset-x-14">
          <p>Logistics Team</p>
          <p>Developed by Jed Tenorio</p>
        </div>
      </section>
    </main>
  )
}
