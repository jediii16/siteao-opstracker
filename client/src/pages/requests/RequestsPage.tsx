import { ClipboardList } from 'lucide-react'
import { ModulePlaceholderPage } from '@/components/common/ModulePlaceholderPage'

export function RequestsPage() {
  return <ModulePlaceholderPage title="Manage Borrowing Requests" description="Review current and historical borrowing requests." cardTitle="Borrowing requests" cardDescription="Request records, statuses, and review actions will appear here." icon={ClipboardList} />
}
