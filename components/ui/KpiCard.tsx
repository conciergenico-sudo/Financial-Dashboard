// components/ui/KpiCard.tsx
import { Card } from './Card'
import { formatChangePercent } from '@/lib/utils'
import { clsx } from 'clsx'

interface KpiCardProps {
  label: string
  value: string
  changePercent?: number
  subValue?: string
  subValueRed?: boolean
  accentColor?: string
}

export function KpiCard({
  label,
  value,
  changePercent,
  subValue,
  subValueRed,
  accentColor = 'text-gray-900',
}: KpiCardProps) {
  const isPositive = (changePercent ?? 0) >= 0
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
  const changeArrow = isPositive ? '↑' : '↓'

  return (
    <Card>
      <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
      <p className={clsx('text-2xl font-bold', accentColor)}>{value}</p>
      {changePercent !== undefined && (
        <p className={clsx('text-sm mt-1', changeColor)}>
          {changeArrow} {formatChangePercent(Math.abs(changePercent))} vs last week
        </p>
      )}
      {subValue && (
        <p className={clsx('text-sm mt-1', subValueRed ? 'text-red-600' : 'text-gray-500')}>
          {subValue}
        </p>
      )}
    </Card>
  )
}
