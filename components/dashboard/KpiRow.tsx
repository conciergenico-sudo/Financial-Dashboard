// components/dashboard/KpiRow.tsx
import { KpiCard } from '@/components/ui/KpiCard'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { KpiData } from '@/types/dashboard'

interface KpiRowProps {
  kpi: KpiData
}

export function KpiRow({ kpi }: KpiRowProps) {
  const { revenue, invoices, cash, profitMargin } = kpi
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <KpiCard
        label="Revenue This Week"
        value={formatCurrency(revenue.thisWeek)}
        changePercent={revenue.changePercent}
        accentColor="text-blue-600"
      />
      <KpiCard
        label="Outstanding Invoices"
        value={formatCurrency(invoices.outstanding)}
        subValue={
          invoices.overdue > 0
            ? `${formatCurrency(invoices.overdue)} overdue`
            : `${invoices.count} invoices`
        }
        subValueRed={invoices.overdue > 0}
        accentColor="text-purple-600"
      />
      <KpiCard
        label="Cash Position"
        value={formatCurrency(cash.balance)}
        changePercent={cash.changePercent !== 0 ? cash.changePercent : undefined}
        accentColor="text-green-600"
      />
      <KpiCard
        label="Net Profit Margin"
        value={formatPercent(profitMargin.thisWeek)}
        changePercent={profitMargin.changePercent}
        accentColor="text-indigo-600"
      />
    </div>
  )
}
