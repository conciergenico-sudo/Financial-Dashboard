// components/ui/Badge.tsx
import { clsx } from 'clsx'
import type { Invoice } from '@/types/dashboard'

const STATUS_STYLES: Record<Invoice['status'], string> = {
  overdue: 'bg-red-100 text-red-700',
  'due-soon': 'bg-amber-100 text-amber-700',
  upcoming: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<Invoice['status'], string> = {
  overdue: 'Overdue',
  'due-soon': 'Due Soon',
  upcoming: 'Upcoming',
}

interface BadgeProps {
  status: Invoice['status']
}

export function Badge({ status }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
