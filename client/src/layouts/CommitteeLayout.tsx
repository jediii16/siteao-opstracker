import { WorkspaceLayout } from '@/components/common/WorkspaceLayout'
import { committeeNavigation } from '@/lib/navigation'

export function CommitteeLayout() {
  return <WorkspaceLayout navigation={committeeNavigation} workspace="Committee" />
}
