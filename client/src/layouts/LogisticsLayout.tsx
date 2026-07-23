import { WorkspaceLayout } from '@/components/common/WorkspaceLayout'
import { logisticsNavigation } from '@/lib/navigation'

export function LogisticsLayout() {
  return <WorkspaceLayout navigation={logisticsNavigation} workspace="Logistics" />
}
