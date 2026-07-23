import { FileSearch } from 'lucide-react'
import { ModulePlaceholderPage } from '@/components/common/ModulePlaceholderPage'

export function RequestDetailsPage() {
  return <ModulePlaceholderPage title="Request Details" description="Review the information attached to a borrowing request." cardTitle="Request record" cardDescription="Request metadata, items, and approval history will appear here." icon={FileSearch} />
}
