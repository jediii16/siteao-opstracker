import { Users } from 'lucide-react'
import { ModulePlaceholderPage } from '@/components/common/ModulePlaceholderPage'

export function CommitteeAccountsPage() {
  return <ModulePlaceholderPage title="Committee Account Management" description="Manage the committees that will access OpsTracker." cardTitle="Committee accounts" cardDescription="Account records and access settings will appear here." icon={Users} />
}
