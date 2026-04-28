// components/dashboard/CashFlowChart.tsx
'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import type { CashFlowPoint } from '@/types/dashboard'

const formatTick = (val: number) =>
  val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`

const formatTooltip = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

interface Props {
  data: CashFlowPoint[]
}

export function CashFlowChart({ data }: Props) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Cash In vs Cash Out</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
            formatter={(val: unknown, name: unknown) => [
              typeof val === 'number' ? formatTooltip(val) : '',
              name === 'cashIn' ? 'Cash In' : 'Cash Out',
            ]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend
            formatter={(val) => (val === 'cashIn' ? 'Cash In' : 'Cash Out')}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Line type="monotone" dataKey="cashIn" stroke="#16a34a" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="cashOut" stroke="#dc2626" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
