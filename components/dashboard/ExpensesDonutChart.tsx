// components/dashboard/ExpensesDonutChart.tsx
'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/Card'
import type { ExpenseCategory } from '@/types/dashboard'

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#6b7280']

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

interface Props {
  data: ExpenseCategory[]
}

export function ExpensesDonutChart({ data }: Props) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Expenses by Category</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: unknown) => [
              typeof val === 'number' ? formatCurrency(val) : '',
              '',
            ]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
