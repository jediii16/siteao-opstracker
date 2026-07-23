import { ShieldCheck } from 'lucide-react'
import { ModulePlaceholderPage } from '@/components/common/ModulePlaceholderPage'

export function AuditLogsPage() {
  return <ModulePlaceholderPage title="System Audit Logs" description="Review a future record of significant system activity." cardTitle="Audit trail" cardDescription="User actions and system events will appear here after integration." icon={ShieldCheck} />
}
