// app/page.tsx
import { ConnectPrompt } from '@/components/dashboard/ConnectPrompt'
import { Header } from '@/components/dashboard/Header'
import { KpiRow } from '@/components/dashboard/KpiRow'
import { RevenueBarChart } from '@/components/dashboard/RevenueBarChart'
import { ExpensesDonutChart } from '@/components/dashboard/ExpensesDonutChart'
import { CashFlowChart } from '@/components/dashboard/CashFlowChart'
import { ProfitMarginChart } from '@/components/dashboard/ProfitMarginChart'
import { SalesByServiceChart } from '@/components/dashboard/SalesByServiceChart'
import { NewVsRecurringSection } from '@/components/dashboard/NewVsRecurringSection'
import { InvoicesTable } from '@/components/dashboard/InvoicesTable'
import type { DashboardData } from '@/types/dashboard'

async function getDashboardData(): Promise<{ connected: boolean; data?: DashboardData; error?: string }> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/dashboard`, { cache: 'no-store' })
  return res.json()
}

export default async function DashboardPage() {
  const result = await getDashboardData()

  if (!result.connected) {
    return <ConnectPrompt />
  }

  if (result.error || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <p className="text-gray-500 text-sm mb-2">Unable to load dashboard data.</p>
          <p className="text-red-500 text-xs font-mono">{result.error ?? 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  const d = result.data

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Header
          companyName={d.companyName}
          weekLabel={d.weekRange.label}
          lastUpdated={d.lastUpdated}
        />

        <KpiRow kpi={d.kpi} />

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <RevenueBarChart data={d.weeklyRevenue} />
          <ExpensesDonutChart data={d.expensesByCategory} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <CashFlowChart data={d.cashFlow} />
          <ProfitMarginChart data={d.profitMarginTrend} />
        </div>

        {/* Sales Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <SalesByServiceChart data={d.salesByService} />
          <NewVsRecurringSection
            newClients={d.newClients}
            recurringClients={d.recurringClients}
          />
        </div>

        {/* Invoices */}
        <InvoicesTable invoices={d.invoices} />
      </div>
    </main>
  )
}
