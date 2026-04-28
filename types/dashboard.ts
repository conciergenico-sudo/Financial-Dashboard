// types/dashboard.ts

export interface WeekRange {
  start: string        // ISO date string "2026-04-21"
  end: string          // ISO date string "2026-04-27"
  label: string        // "Apr 21 – 27, 2026"
}

export interface KpiData {
  revenue: {
    thisWeek: number
    changePercent: number  // positive = up, negative = down
  }
  invoices: {
    outstanding: number
    count: number
    overdue: number
  }
  cash: {
    balance: number
    changePercent: number
  }
  profitMargin: {
    thisWeek: number       // percentage e.g. 34.5
    changePercent: number
  }
}

export interface WeeklyRevenue {
  week: string           // "Apr 21"
  revenue: number
  isCurrent: boolean
}

export interface ExpenseCategory {
  name: string
  amount: number
}

export interface CashFlowPoint {
  week: string
  cashIn: number
  cashOut: number
}

export interface ProfitMarginPoint {
  week: string
  margin: number         // percentage
}

export interface ServiceRevenue {
  service: string
  revenue: number
}

export interface ClientSegment {
  revenue: number
  count: number
}

export interface Invoice {
  id: string
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string        // ISO date string
  status: 'overdue' | 'due-soon' | 'upcoming'
}

export interface DashboardData {
  companyName: string
  lastUpdated: string        // ISO timestamp
  weekRange: WeekRange
  kpi: KpiData
  weeklyRevenue: WeeklyRevenue[]   // 8 items, oldest first
  expensesByCategory: ExpenseCategory[]
  cashFlow: CashFlowPoint[]        // 8 items, oldest first
  profitMarginTrend: ProfitMarginPoint[]  // 8 items, oldest first
  salesByService: ServiceRevenue[]
  newClients: ClientSegment
  recurringClients: ClientSegment
  invoices: Invoice[]
}

export interface QBTokens {
  access_token: string
  refresh_token: string
  realm_id: string
  expires_at: number     // unix timestamp ms
}
