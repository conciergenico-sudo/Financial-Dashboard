// components/dashboard/SalesByServiceChart.tsx
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import type { ServiceRevenue } from '@/types/dashboard'

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

interface Props {
  data: ServiceRevenue[]
}

export function SalesByServiceChart({ data }: Props) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Sales by Service</h3>
      <ResponsiveContainer width="100%" height={Math.max(data.length * 44, 160)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 60, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="service"
            tick={{ fontSize: 11, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            formatter={(val: unknown) => [typeof val === 'number' ? formatCurrency(val) : '', 'Revenue']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#6b7280', formatter: (val: unknown) => typeof val === 'number' ? formatCurrency(val) : '' }}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
