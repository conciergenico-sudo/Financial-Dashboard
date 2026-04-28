// lib/qb/transform.ts
import type {
  DashboardData, WeeklyRevenue, ExpenseCategory, CashFlowPoint,
  ProfitMarginPoint, ServiceRevenue, ClientSegment, Invoice, WeekRange, KpiData,
} from '@/types/dashboard'
import { classifyInvoiceStatus } from '@/lib/utils'

interface ColData { value: string }
interface QBRow {
  type?: string
  group?: string
  Header?: { ColData: ColData[] }
  Rows?: { Row: QBRow[] }
  Summary?: { ColData: ColData[] }
  ColData?: ColData[]
}
interface QBPL {
  Columns: { Column: Array<{ ColTitle: string; ColType: string }> }
  Rows: { Row: QBRow[] }
}
interface QBInvoice {
  Id: string
  DocNumber: string
  CustomerRef: { name: string }
  Balance: number
  DueDate: string
  TxnDate?: string
  TotalAmt?: number
}
interface QBInvoiceResponse {
  QueryResponse: { Invoice?: QBInvoice[] }
}
interface QBAccountResponse {
  QueryResponse: { Account?: Array<{ CurrentBalance: number }> }
}
interface QBCompanyInfo {
  CompanyInfo: { CompanyName: string }
}

function parseAmount(val: string | undefined): number {
  const n = parseFloat(val ?? '0')
  return isNaN(n) ? 0 : n
}

function findSection(rows: QBRow[], group: string): QBRow | undefined {
  return rows.find(r => r.group === group)
}

function getSummaryValues(section: QBRow): number[] {
  return (section.Summary?.ColData ?? []).slice(1).map(c => parseAmount(c.value))
}

export function extractWeeklyRevenue(pl: QBPL, currentWeekLabel: string): WeeklyRevenue[] {
  const moneyCols = pl.Columns.Column.filter(
    c => c.ColType === 'Money' && c.ColTitle !== 'TOTAL'
  )
  const incomeSection = findSection(pl.Rows.Row, 'Income')
  if (!incomeSection) return []
  const summaryValues = getSummaryValues(incomeSection)
  return moneyCols.map((col, idx) => ({
    week: col.ColTitle,
    revenue: summaryValues[idx] ?? 0,
    isCurrent: col.ColTitle === currentWeekLabel,
  }))
}

export function extractExpensesByCategory(pl: QBPL): ExpenseCategory[] {
  const expenseSection = findSection(pl.Rows.Row, 'Expenses')
  if (!expenseSection?.Rows?.Row) return []
  const moneyCols = pl.Columns.Column.filter(
    c => c.ColType === 'Money' && c.ColTitle !== 'TOTAL'
  )
  const lastColIdx = moneyCols.length - 1
  const buckets: Record<string, number> = {
    Payroll: 0, Marketing: 0, Software: 0, Operations: 0, Other: 0,
  }
  for (const row of expenseSection.Rows.Row) {
    if (row.type === 'data' && row.ColData) {
      const name = row.ColData[0]?.value ?? ''
      const amount = parseAmount(row.ColData[lastColIdx + 1]?.value)
      const bucket = classifyExpenseRow(name)
      buckets[bucket] += amount
    }
  }
  return Object.entries(buckets)
    .filter(([, amount]) => amount > 0)
    .map(([name, amount]) => ({ name, amount }))
}

export function classifyExpenseRow(name: string): string {
  const lower = name.toLowerCase()
  if (/salary|payroll|wages|compensation|hr |human resources/.test(lower)) return 'Payroll'
  if (/marketing|advertis|ads|social media|seo|promo/.test(lower)) return 'Marketing'
  if (/software|subscri|saas|license|app |platform/.test(lower)) return 'Software'
  if (/rent|utilities|office|operations|facility|supplies/.test(lower)) return 'Operations'
  return 'Other'
}

export function extractCashFlow(pl: QBPL): CashFlowPoint[] {
  const moneyCols = pl.Columns.Column.filter(
    c => c.ColType === 'Money' && c.ColTitle !== 'TOTAL'
  )
  const income = findSection(pl.Rows.Row, 'Income')
  const expenses = findSection(pl.Rows.Row, 'Expenses')
  const incomeVals = income ? getSummaryValues(income) : []
  const expenseVals = expenses ? getSummaryValues(expenses) : []
  return moneyCols.map((col, idx) => ({
    week: col.ColTitle,
    cashIn: incomeVals[idx] ?? 0,
    cashOut: expenseVals[idx] ?? 0,
  }))
}

export function extractProfitMarginTrend(pl: QBPL): ProfitMarginPoint[] {
  const moneyCols = pl.Columns.Column.filter(
    c => c.ColType === 'Money' && c.ColTitle !== 'TOTAL'
  )
  const income = findSection(pl.Rows.Row, 'Income')
  const netIncome = findSection(pl.Rows.Row, 'NetIncome')
  const incomeVals = income ? getSummaryValues(income) : []
  const netVals = netIncome ? getSummaryValues(netIncome) : []
  return moneyCols.map((col, idx) => {
    const rev = incomeVals[idx] ?? 0
    const net = netVals[idx] ?? 0
    const margin = rev === 0 ? 0 : (net / rev) * 100
    return { week: col.ColTitle, margin: parseFloat(margin.toFixed(1)) }
  })
}

export function extractSalesByService(pl: QBPL): ServiceRevenue[] {
  const incomeSection = findSection(pl.Rows.Row, 'Income')
  if (!incomeSection?.Rows?.Row) return []
  const moneyCols = pl.Columns.Column.filter(
    c => c.ColType === 'Money' && c.ColTitle !== 'TOTAL'
  )
  const lastColIdx = moneyCols.length - 1
  return incomeSection.Rows.Row
    .filter(row => row.type === 'data' && row.ColData)
    .map(row => ({
      service: row.ColData![0]?.value ?? 'Unknown',
      revenue: parseAmount(row.ColData![lastColIdx + 1]?.value),
    }))
    .filter(s => s.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
}

export function transformInvoices(raw: QBInvoiceResponse, today: string): Invoice[] {
  const invoices = raw.QueryResponse.Invoice ?? []
  return invoices
    .filter(inv => inv.Balance > 0)
    .map(inv => ({
      id: inv.Id,
      clientName: inv.CustomerRef.name,
      invoiceNumber: inv.DocNumber,
      amount: inv.Balance,
      dueDate: inv.DueDate,
      status: classifyInvoiceStatus(inv.DueDate, today),
    }))
    .sort((a, b) => {
      const order = { overdue: 0, 'due-soon': 1, upcoming: 2 }
      return order[a.status] - order[b.status]
    })
}

export function extractNewVsRecurring(
  weekInvoices: QBInvoice[],
  allInvoices: QBInvoice[],
  weekStart: string
): { newClients: ClientSegment; recurringClients: ClientSegment } {
  const priorCustomers = new Set(
    allInvoices
      .filter(inv => inv.TxnDate && inv.TxnDate < weekStart)
      .map(inv => inv.CustomerRef.name)
  )
  let newRevenue = 0, newCount = 0
  let recurringRevenue = 0, recurringCount = 0
  const counted = new Set<string>()
  for (const inv of weekInvoices) {
    const name = inv.CustomerRef.name
    if (!counted.has(name)) {
      counted.add(name)
      if (priorCustomers.has(name)) {
        recurringRevenue += inv.TotalAmt ?? 0
        recurringCount++
      } else {
        newRevenue += inv.TotalAmt ?? 0
        newCount++
      }
    }
  }
  return {
    newClients: { revenue: newRevenue, count: newCount },
    recurringClients: { revenue: recurringRevenue, count: recurringCount },
  }
}

export function buildDashboardData(
  companyInfoRaw: QBCompanyInfo,
  plRaw: QBPL,
  invoicesRaw: QBInvoiceResponse,
  weekInvoicesRaw: QBInvoiceResponse,
  allInvoicesRaw: QBInvoiceResponse,
  accountsRaw: QBAccountResponse,
  weekRange: WeekRange
): DashboardData {
  const today = weekRange.end
  const moneyCols = plRaw.Columns.Column.filter(
    c => c.ColType === 'Money' && c.ColTitle !== 'TOTAL'
  )
  const currentWeekLabel = moneyCols[moneyCols.length - 1]?.ColTitle ?? ''
  const prevWeekLabel = moneyCols[moneyCols.length - 2]?.ColTitle ?? ''

  const weeklyRevenue = extractWeeklyRevenue(plRaw, currentWeekLabel)
  const currentRevenue = weeklyRevenue.find(w => w.isCurrent)?.revenue ?? 0
  const prevRevenue = weeklyRevenue.find(w => w.week === prevWeekLabel)?.revenue ?? 0
  const revenueChangePercent = prevRevenue === 0
    ? 0 : ((currentRevenue - prevRevenue) / prevRevenue) * 100

  const marginTrend = extractProfitMarginTrend(plRaw)
  const currentMargin = marginTrend[marginTrend.length - 1]?.margin ?? 0
  const prevMargin = marginTrend[marginTrend.length - 2]?.margin ?? 0
  const marginChange = parseFloat((currentMargin - prevMargin).toFixed(1))

  const cashBalance = (accountsRaw.QueryResponse.Account ?? [])
    .reduce((sum, acc) => sum + (acc.CurrentBalance ?? 0), 0)

  const invoices = transformInvoices(invoicesRaw, today)
  const totalOutstanding = invoices.reduce((s, i) => s + i.amount, 0)
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  const weekInvoices = weekInvoicesRaw.QueryResponse.Invoice ?? []
  const allInvoices = allInvoicesRaw.QueryResponse.Invoice ?? []
  const { newClients, recurringClients } = extractNewVsRecurring(weekInvoices, allInvoices, weekRange.start)

  const kpi: KpiData = {
    revenue: { thisWeek: currentRevenue, changePercent: parseFloat(revenueChangePercent.toFixed(1)) },
    invoices: { outstanding: totalOutstanding, count: invoices.length, overdue: overdueAmount },
    cash: { balance: cashBalance, changePercent: 0 },
    profitMargin: { thisWeek: currentMargin, changePercent: marginChange },
  }

  return {
    companyName: companyInfoRaw?.CompanyInfo?.CompanyName ?? 'My Company',
    lastUpdated: new Date().toISOString(),
    weekRange, kpi, weeklyRevenue,
    expensesByCategory: extractExpensesByCategory(plRaw),
    cashFlow: extractCashFlow(plRaw),
    profitMarginTrend: marginTrend,
    salesByService: extractSalesByService(plRaw),
    newClients, recurringClients, invoices,
  }
}
