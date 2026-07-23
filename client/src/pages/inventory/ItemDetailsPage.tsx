import { PackageSearch } from 'lucide-react'
import { ModulePlaceholderPage } from '@/components/common/ModulePlaceholderPage'

export function ItemDetailsPage() {
  return <ModulePlaceholderPage title="Item Details" description="Review a single inventory item's information and history." cardTitle="Item record" cardDescription="Item metadata and transaction history will appear here." icon={PackageSearch} />
}
