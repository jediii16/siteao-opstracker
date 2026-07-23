import { ClipboardPlus } from 'lucide-react'
import { ModulePlaceholderPage } from '@/components/common/ModulePlaceholderPage'

export function CreateRequestPage() {
  return <ModulePlaceholderPage title="Create Borrow Request" description="A future workspace for preparing a new borrowing request." cardTitle="Borrow request form" cardDescription="Item selection and request validation will be added in a later phase." icon={ClipboardPlus} />
}
