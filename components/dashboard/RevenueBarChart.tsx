// components/dashboard/RevenueBarChart.tsx
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import type { WeeklyRevenue } from '@/types/dashboard'

interface Props {
  data: WeeklyRevenue[]
}

const formatTick = (val: number) =>
  val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`

const formatTooltip = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

export function RevenueBarChart({ data }: Props) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Weekly Revenue</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatTick}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(val: unknown) => [
              typeof val === 'number' ? formatTooltip(val) : '',
              'Revenue',
            ]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.isCurrent ? '#2563eb' : '#bfdbfe'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
