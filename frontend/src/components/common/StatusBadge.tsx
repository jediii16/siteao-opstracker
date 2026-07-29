import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusTone = 'pending' | 'success' | 'danger' | 'progress' | 'inactive'

interface StatusBadgeProps {
  label: string
  tone: StatusTone
}

const toneClasses: Record<StatusTone, string> = {
  pending: 'bg-warning/20 text-warning-foreground ring-1 ring-warning/35',
  success: 'bg-success/15 text-success dark:text-success ring-1 ring-success/30',
  danger: 'bg-destructive/10 text-destructive ring-1 ring-destructive/25',
  progress: 'bg-info/15 text-info-foreground dark:text-info ring-1 ring-info/30',
  inactive: 'bg-muted text-muted-foreground ring-1 ring-border',
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('border-transparent', toneClasses[tone])}>
      {label}
    </Badge>
  )
}
