import { Boxes, ClipboardList, PackageCheck, Users } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'

const metrics = [
  { label: 'Inventory Items', icon: Boxes },
  { label: 'Pending Requests', icon: ClipboardList },
  { label: 'Active Borrowings', icon: PackageCheck },
  { label: 'Committee Accounts', icon: Users },
]

export function LogisticsDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Logistics Dashboard" description="A future overview of inventory operations, requests, and accountable assets." />
      <DashboardOverview metrics={metrics} />
      <SectionCard title="Operations overview" description="Charts and activity will be connected later.">
        <EmptyState title="Dashboard data is not connected" description="Summary charts and recent activity will appear after backend integration." />
      </SectionCard>
    </div>
  )
}
