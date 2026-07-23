import { Boxes, ClipboardClock, ClipboardList, PackageCheck } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'

const metrics = [
  { label: 'Available Items', icon: Boxes },
  { label: 'Draft Requests', icon: ClipboardList },
  { label: 'Pending Requests', icon: ClipboardClock },
  { label: 'Borrowed Items', icon: PackageCheck },
]

export function CommitteeDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Committee Dashboard" description="A future overview of committee requests, borrowed items, and request history." />
      <DashboardOverview metrics={metrics} />
      <SectionCard title="Committee activity" description="Request activity will be connected later.">
        <EmptyState title="No activity to display" description="Committee request history will appear after backend integration." />
      </SectionCard>
    </div>
  )
}
