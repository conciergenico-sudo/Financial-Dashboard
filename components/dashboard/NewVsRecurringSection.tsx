// components/dashboard/NewVsRecurringSection.tsx
'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import type { ClientSegment } from '@/types/dashboard'

interface Props {
  newClients: ClientSegment
  recurringClients: ClientSegment
}

export function NewVsRecurringSection({ newClients, recurringClients }: Props) {
  const pieData = [
    { name: 'New', value: newClients.revenue, color: '#2563eb' },
    { name: 'Recurring', value: recurringClients.revenue, color: '#7c3aed' },
  ].filter(d => d.value > 0)

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">New vs Recurring Clients</h3>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-full sm:w-48 h-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: unknown) => [typeof val === 'number' ? formatCurrency(val) : '', '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3 flex-1 w-full">
          <StatCard
            label="New Clients"
            revenue={newClients.revenue}
            count={newClients.count}
            dot="bg-blue-600"
          />
          <StatCard
            label="Recurring Clients"
            revenue={recurringClients.revenue}
            count={recurringClients.count}
            dot="bg-purple-600"
          />
        </div>
      </div>
    </Card>
  )
}

function StatCard({
  label, revenue, count, dot,
}: {
  label: string
  revenue: number
  count: number
  dot: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{formatCurrency(revenue)}</p>
        <p className="text-xs text-gray-500">{count} client{count !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}
