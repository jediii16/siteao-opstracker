import { ArrowLeftRight } from 'lucide-react'
import { ModulePlaceholderPage } from '@/components/common/ModulePlaceholderPage'

export function TransactionsPage() {
  return <ModulePlaceholderPage title="Inventory Transactions" description="Track future releases, returns, and inventory movements." cardTitle="Transaction history" cardDescription="Inventory movement records will appear here." icon={ArrowLeftRight} />
}
