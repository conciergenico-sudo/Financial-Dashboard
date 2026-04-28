// components/dashboard/ProfitMarginChart.tsx
'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import type { ProfitMarginPoint } from '@/types/dashboard'

interface Props {
  data: ProfitMarginPoint[]
}

export function ProfitMarginChart({ data }: Props) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Net Profit Margin Trend</h3>
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
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(val: unknown) => [
              typeof val === 'number' ? `${val.toFixed(1)}%` : '',
              'Net Margin',
            ]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <ReferenceLine y={0} stroke="#e5e7eb" />
          <Line
            type="monotone"
            dataKey="margin"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ fill: '#7c3aed', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
