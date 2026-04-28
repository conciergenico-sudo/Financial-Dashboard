# Pawsome Financial Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 weekly financial dashboard that connects to QuickBooks via OAuth 2.0, displays KPIs/charts/invoices, and is deployable to Vercel as a shared read-only URL.

**Architecture:** Server component (`app/page.tsx`) fetches aggregated data from an internal API route on every load (no cache); that route calls QuickBooks using tokens stored in Vercel KV and auto-refreshes them. Chart components are Client Components using Recharts; all other UI is Server Components.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, `@vercel/kv` for token persistence, native `fetch` for QuickBooks API, Jest + Testing Library for unit tests.

---

## File Map

```
PawsomeFinancialDashboard/
├── app/
│   ├── globals.css
│   ├── layout.tsx                        # Root layout, metadata
│   ├── page.tsx                          # Server component: fetches + renders dashboard
│   ├── loading.tsx                       # Suspense skeleton (auto-used by Next.js)
│   ├── error.tsx                         # Error boundary client component
│   └── api/
│       ├── connect/route.ts              # GET → redirect to QB OAuth consent screen
│       ├── auth/quickbooks/route.ts      # GET → OAuth callback, store tokens in KV
│       └── dashboard/route.ts            # GET → aggregate all QB data, return JSON
├── components/
│   ├── ui/
│   │   ├── Card.tsx                      # White card with shadow wrapper
│   │   ├── Badge.tsx                     # Status badge (overdue/due-soon/upcoming)
│   │   └── KpiCard.tsx                   # Single KPI card (value + change + label)
│   └── dashboard/
│       ├── Header.tsx                    # Company name, week range, status, last updated
│       ├── KpiRow.tsx                    # 4-card KPI grid row
│       ├── RevenueBarChart.tsx           # "use client" — 8-week revenue bars
│       ├── ExpensesDonutChart.tsx        # "use client" — expenses by category donut
│       ├── CashFlowChart.tsx             # "use client" — cash in/out dual line
│       ├── ProfitMarginChart.tsx         # "use client" — net margin trend line
│       ├── SalesByServiceChart.tsx       # "use client" — horizontal bar per service
│       ├── NewVsRecurringSection.tsx     # "use client" — donut + stat cards
│       ├── InvoicesTable.tsx             # Outstanding invoices sorted by urgency
│       └── DashboardSkeleton.tsx        # Full-page loading skeleton (used in loading.tsx)
├── lib/
│   ├── qb/
│   │   ├── auth.ts                       # QB OAuth URL builder + token exchange
│   │   ├── client.ts                     # QB API calls with auto token refresh via KV
│   │   └── transform.ts                  # Raw QB API responses → DashboardData
│   └── utils.ts                          # formatCurrency, formatPercent, getWeekRange, dates
├── types/
│   └── dashboard.ts                      # All shared TypeScript interfaces
├── __tests__/
│   ├── utils.test.ts
│   └── transform.test.ts
├── jest.config.js
├── jest.setup.ts
├── .env.example
├── vercel.json
├── next.config.ts
└── README.md
```

---

## Task 1: Scaffold Next.js 14 project

**Files:**
- Create: `PawsomeFinancialDashboard/` (entire project)

- [ ] **Step 1: Run create-next-app**

```bash
cd "C:\Users\nicol\Documents"
npx create-next-app@14 PawsomeFinancialDashboard --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
cd PawsomeFinancialDashboard
```

Expected: Project scaffolded with `app/`, `public/`, `package.json`, `tailwind.config.ts`, `tsconfig.json`.

- [ ] **Step 2: Verify it starts**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000. Then stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js 14 project"
```

---

## Task 2: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install recharts @vercel/kv clsx
```

- [ ] **Step 2: Install dev/test dependencies**

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest ts-jest
```

- [ ] **Step 3: Create `jest.config.js`**

```js
// jest.config.js
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })
module.exports = createJestConfig({
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
})
```

- [ ] **Step 4: Create `jest.setup.ts`**

```ts
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to `package.json`**

Open `package.json` and add to the `"scripts"` block:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: add recharts, vercel/kv, jest, testing-library"
```

---

## Task 3: Define TypeScript types

**Files:**
- Create: `types/dashboard.ts`

- [ ] **Step 1: Write `types/dashboard.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add types/dashboard.ts
git commit -m "feat: add dashboard TypeScript types"
```

---

## Task 4: Utility functions + tests

**Files:**
- Create: `lib/utils.ts`
- Create: `__tests__/utils.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// __tests__/utils.test.ts
import {
  formatCurrency,
  formatPercent,
  formatChangePercent,
  getWeekRange,
  getDateNWeeksAgo,
  classifyInvoiceStatus,
} from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats positive number', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })
  it('formats large number', () => {
    expect(formatCurrency(100000)).toBe('$100,000.00')
  })
})

describe('formatPercent', () => {
  it('formats positive', () => {
    expect(formatPercent(34.567)).toBe('34.6%')
  })
  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })
})

describe('formatChangePercent', () => {
  it('returns + prefix for positive', () => {
    expect(formatChangePercent(12.3)).toBe('+12.3%')
  })
  it('returns - prefix for negative', () => {
    expect(formatChangePercent(-5.5)).toBe('-5.5%')
  })
  it('returns 0.0% for zero', () => {
    expect(formatChangePercent(0)).toBe('0.0%')
  })
})

describe('classifyInvoiceStatus', () => {
  const today = '2026-04-27'
  it('marks past due as overdue', () => {
    expect(classifyInvoiceStatus('2026-04-20', today)).toBe('overdue')
  })
  it('marks due within 7 days as due-soon', () => {
    expect(classifyInvoiceStatus('2026-04-30', today)).toBe('due-soon')
  })
  it('marks due more than 7 days away as upcoming', () => {
    expect(classifyInvoiceStatus('2026-05-10', today)).toBe('upcoming')
  })
  it('marks today as due-soon', () => {
    expect(classifyInvoiceStatus('2026-04-27', today)).toBe('due-soon')
  })
})

describe('getWeekRange', () => {
  it('returns Mon–Sun for a Monday input', () => {
    const range = getWeekRange(new Date('2026-04-27'))
    expect(range.start).toBe('2026-04-27')
    expect(range.end).toBe('2026-05-03')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/utils.test.ts --no-coverage
```

Expected: All tests FAIL with "Cannot find module '@/lib/utils'"

- [ ] **Step 3: Write `lib/utils.ts`**

```ts
// lib/utils.ts

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatChangePercent(value: number): string {
  if (value === 0) return '0.0%'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function classifyInvoiceStatus(
  dueDateStr: string,
  todayStr: string
): 'overdue' | 'due-soon' | 'upcoming' {
  const due = new Date(dueDateStr)
  const today = new Date(todayStr)
  const diffMs = due.getTime() - today.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 7) return 'due-soon'
  return 'upcoming'
}

// Returns the Monday of the week containing `date`
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // Sunday = 0, shift back to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getWeekRange(date: Date): { start: string; end: string; label: string } {
  const monday = getMondayOfWeek(date)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const start = toISODate(monday)
  const end = toISODate(sunday)

  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  const yearFmt = new Intl.DateTimeFormat('en-US', { year: 'numeric' })
  const label = `${fmt.format(monday)} – ${fmt.format(sunday)}, ${yearFmt.format(sunday)}`

  return { start, end, label }
}

export function getDateNWeeksAgo(n: number, from: Date = new Date()): Date {
  const d = new Date(from)
  d.setDate(d.getDate() - n * 7)
  return d
}

// Returns short label like "Apr 21" from ISO date string
export function shortWeekLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/utils.test.ts --no-coverage
```

Expected: All 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts __tests__/utils.test.ts jest.config.js jest.setup.ts
git commit -m "feat: add utility functions with tests"
```

---

## Task 5: QuickBooks OAuth auth module

**Files:**
- Create: `lib/qb/auth.ts`

- [ ] **Step 1: Write `lib/qb/auth.ts`**

```ts
// lib/qb/auth.ts

const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2'
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
const SCOPES = 'com.intuit.quickbooks.accounting'

export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.QUICKBOOKS_CLIENT_ID!,
    response_type: 'code',
    scope: SCOPES,
    redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI!,
    state: 'pawsome_dashboard',
  })
  return `${QB_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(
  code: string,
  realmId: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const credentials = Buffer.from(
    `${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI!,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`QB token exchange failed: ${res.status} ${err}`)
  }

  return res.json()
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const credentials = Buffer.from(
    `${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`QB token refresh failed: ${res.status} ${err}`)
  }

  return res.json()
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/qb/auth.ts
git commit -m "feat: add QuickBooks OAuth auth module"
```

---

## Task 6: QuickBooks API client with auto token refresh

**Files:**
- Create: `lib/qb/client.ts`

- [ ] **Step 1: Write `lib/qb/client.ts`**

```ts
// lib/qb/client.ts
import { kv } from '@vercel/kv'
import { refreshAccessToken } from './auth'
import type { QBTokens } from '@/types/dashboard'

const KV_KEY = 'qb_tokens'
const QB_BASE = 'https://quickbooks.api.intuit.com'

export async function getTokens(): Promise<QBTokens | null> {
  try {
    const tokens = await kv.get<QBTokens>(KV_KEY)
    return tokens
  } catch {
    return null
  }
}

export async function saveTokens(tokens: QBTokens): Promise<void> {
  await kv.set(KV_KEY, tokens)
}

async function getValidAccessToken(): Promise<{ accessToken: string; realmId: string } | null> {
  const tokens = await getTokens()
  if (!tokens) return null

  const nowMs = Date.now()
  // Refresh if token expires within 5 minutes
  if (tokens.expires_at - nowMs < 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(tokens.refresh_token)
    const updated: QBTokens = {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      realm_id: tokens.realm_id,
      expires_at: nowMs + refreshed.expires_in * 1000,
    }
    await saveTokens(updated)
    return { accessToken: updated.access_token, realmId: updated.realm_id }
  }

  return { accessToken: tokens.access_token, realmId: tokens.realm_id }
}

export async function qbFetch(path: string): Promise<unknown> {
  const auth = await getValidAccessToken()
  if (!auth) throw new Error('NOT_CONNECTED')

  const url = `${QB_BASE}/v3/company/${auth.realmId}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`QB API error ${res.status}: ${err}`)
  }

  return res.json()
}

export async function isConnected(): Promise<boolean> {
  const tokens = await getTokens()
  return tokens !== null
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/qb/client.ts
git commit -m "feat: add QuickBooks API client with auto token refresh"
```

---

## Task 7: QuickBooks data transformer + tests

**Files:**
- Create: `lib/qb/transform.ts`
- Create: `__tests__/transform.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// __tests__/transform.test.ts
import {
  extractWeeklyRevenue,
  extractExpensesByCategory,
  classifyExpenseRow,
  transformInvoices,
} from '@/lib/qb/transform'

describe('extractWeeklyRevenue', () => {
  it('parses P&L columns into weekly revenue array', () => {
    const mockPL = {
      Columns: {
        Column: [
          { ColTitle: '', ColType: 'Account' },
          { ColTitle: 'Apr 14', ColType: 'Money' },
          { ColTitle: 'Apr 21', ColType: 'Money' },
          { ColTitle: 'TOTAL', ColType: 'Money' },
        ],
      },
      Rows: {
        Row: [
          {
            type: 'Section',
            group: 'Income',
            Summary: {
              ColData: [
                { value: 'Total Income' },
                { value: '1000.00' },
                { value: '1500.00' },
                { value: '2500.00' },
              ],
            },
          },
        ],
      },
    }
    const result = extractWeeklyRevenue(mockPL, 'Apr 21')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ week: 'Apr 14', revenue: 1000, isCurrent: false })
    expect(result[1]).toEqual({ week: 'Apr 21', revenue: 1500, isCurrent: true })
  })
})

describe('classifyExpenseRow', () => {
  it('classifies payroll keywords', () => {
    expect(classifyExpenseRow('Salary Expense')).toBe('Payroll')
    expect(classifyExpenseRow('Payroll Taxes')).toBe('Payroll')
  })
  it('classifies marketing keywords', () => {
    expect(classifyExpenseRow('Facebook Ads')).toBe('Marketing')
    expect(classifyExpenseRow('Google Advertising')).toBe('Marketing')
  })
  it('classifies software keywords', () => {
    expect(classifyExpenseRow('Subscriptions')).toBe('Software')
    expect(classifyExpenseRow('Software License')).toBe('Software')
  })
  it('classifies unknown as Other', () => {
    expect(classifyExpenseRow('Random Expense')).toBe('Other')
  })
})

describe('transformInvoices', () => {
  it('classifies overdue invoice', () => {
    const raw = {
      QueryResponse: {
        Invoice: [
          {
            Id: '1',
            DocNumber: 'INV-001',
            CustomerRef: { name: 'Acme Corp' },
            Balance: 500,
            DueDate: '2026-04-01',
          },
        ],
      },
    }
    const result = transformInvoices(raw, '2026-04-27')
    expect(result[0].status).toBe('overdue')
    expect(result[0].clientName).toBe('Acme Corp')
    expect(result[0].amount).toBe(500)
  })
  it('classifies due-soon invoice', () => {
    const raw = {
      QueryResponse: {
        Invoice: [
          {
            Id: '2',
            DocNumber: 'INV-002',
            CustomerRef: { name: 'Beta LLC' },
            Balance: 200,
            DueDate: '2026-04-30',
          },
        ],
      },
    }
    const result = transformInvoices(raw, '2026-04-27')
    expect(result[0].status).toBe('due-soon')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/transform.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module '@/lib/qb/transform'"

- [ ] **Step 3: Write `lib/qb/transform.ts`**

```ts
// lib/qb/transform.ts
import type {
  DashboardData, WeeklyRevenue, ExpenseCategory, CashFlowPoint,
  ProfitMarginPoint, ServiceRevenue, ClientSegment, Invoice, WeekRange, KpiData,
} from '@/types/dashboard'
import { classifyInvoiceStatus, shortWeekLabel, toISODate, getMondayOfWeek } from '@/lib/utils'

// ─── Internal QB response type helpers ───────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Exports ──────────────────────────────────────────────────────────────────

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
  // Customers who had ANY invoice BEFORE this week
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

  // Revenue
  const weeklyRevenue = extractWeeklyRevenue(plRaw, currentWeekLabel)
  const currentRevenue = weeklyRevenue.find(w => w.isCurrent)?.revenue ?? 0
  const prevRevenue = weeklyRevenue.find(w => w.week === prevWeekLabel)?.revenue ?? 0
  const revenueChangePercent = prevRevenue === 0
    ? 0
    : ((currentRevenue - prevRevenue) / prevRevenue) * 100

  // Profit margin
  const marginTrend = extractProfitMarginTrend(plRaw)
  const currentMargin = marginTrend[marginTrend.length - 1]?.margin ?? 0
  const prevMargin = marginTrend[marginTrend.length - 2]?.margin ?? 0
  const marginChange = parseFloat((currentMargin - prevMargin).toFixed(1))

  // Cash
  const cashBalance = (accountsRaw.QueryResponse.Account ?? [])
    .reduce((sum, acc) => sum + (acc.CurrentBalance ?? 0), 0)

  // Invoices
  const invoices = transformInvoices(invoicesRaw, today)
  const totalOutstanding = invoices.reduce((s, i) => s + i.amount, 0)
  const overdueAmount = invoices
    .filter(i => i.status === 'overdue')
    .reduce((s, i) => s + i.amount, 0)

  // New vs recurring
  const weekInvoices = weekInvoicesRaw.QueryResponse.Invoice ?? []
  const allInvoices = allInvoicesRaw.QueryResponse.Invoice ?? []
  const { newClients, recurringClients } = extractNewVsRecurring(
    weekInvoices, allInvoices, weekRange.start
  )

  const kpi: KpiData = {
    revenue: {
      thisWeek: currentRevenue,
      changePercent: parseFloat(revenueChangePercent.toFixed(1)),
    },
    invoices: {
      outstanding: totalOutstanding,
      count: invoices.length,
      overdue: overdueAmount,
    },
    cash: {
      balance: cashBalance,
      changePercent: 0, // QB doesn't easily give last-week balance without extra call
    },
    profitMargin: {
      thisWeek: currentMargin,
      changePercent: marginChange,
    },
  }

  return {
    companyName: companyInfoRaw.CompanyInfo.CompanyName,
    lastUpdated: new Date().toISOString(),
    weekRange,
    kpi,
    weeklyRevenue,
    expensesByCategory: extractExpensesByCategory(plRaw),
    cashFlow: extractCashFlow(plRaw),
    profitMarginTrend: marginTrend,
    salesByService: extractSalesByService(plRaw),
    newClients,
    recurringClients,
    invoices,
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/transform.test.ts --no-coverage
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/qb/transform.ts __tests__/transform.test.ts
git commit -m "feat: add QuickBooks data transformer with tests"
```

---

## Task 8: API route — OAuth connect

**Files:**
- Create: `app/api/connect/route.ts`

- [ ] **Step 1: Write `app/api/connect/route.ts`**

```ts
// app/api/connect/route.ts
import { NextResponse } from 'next/server'
import { buildAuthUrl } from '@/lib/qb/auth'

export async function GET() {
  const url = buildAuthUrl()
  return NextResponse.redirect(url)
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/connect/route.ts
git commit -m "feat: add QuickBooks OAuth connect route"
```

---

## Task 9: API route — OAuth callback

**Files:**
- Create: `app/api/auth/quickbooks/route.ts`

- [ ] **Step 1: Write `app/api/auth/quickbooks/route.ts`**

```ts
// app/api/auth/quickbooks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/qb/auth'
import { saveTokens } from '@/lib/qb/client'
import type { QBTokens } from '@/types/dashboard'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const realmId = searchParams.get('realmId')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, req.url))
  }

  if (!code || !realmId) {
    return NextResponse.redirect(new URL('/?error=missing_params', req.url))
  }

  try {
    const tokens = await exchangeCodeForTokens(code, realmId)
    const qbTokens: QBTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      realm_id: realmId,
      expires_at: Date.now() + tokens.expires_in * 1000,
    }
    await saveTokens(qbTokens)
    return NextResponse.redirect(new URL('/?connected=true', req.url))
  } catch (err) {
    console.error('QB OAuth callback error:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/quickbooks/route.ts
git commit -m "feat: add QuickBooks OAuth callback route"
```

---

## Task 10: API route — Dashboard data aggregation

**Files:**
- Create: `app/api/dashboard/route.ts`

- [ ] **Step 1: Write `app/api/dashboard/route.ts`**

```ts
// app/api/dashboard/route.ts
import { NextResponse } from 'next/server'
import { qbFetch, getTokens } from '@/lib/qb/client'
import { buildDashboardData } from '@/lib/qb/transform'
import { getWeekRange, toISODate, getDateNWeeksAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Single KV read — gives us both the connection check and realm_id
  const tokens = await getTokens()
  if (!tokens) {
    return NextResponse.json({ connected: false }, { status: 200 })
  }

  try {
    const { realm_id: realmId } = tokens
    const now = new Date()
    const weekRange = getWeekRange(now)
    const eightWeeksAgo = toISODate(getDateNWeeksAgo(8, now))
    const oneYearAgo = toISODate(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()))

    // Fire all QB API calls in parallel
    const [companyInfoRaw, plRaw, invoicesRaw, weekInvoicesRaw, allInvoicesRaw, accountsRaw] =
      await Promise.all([
        // Company info — QB endpoint is /companyinfo/{realmId}
        qbFetch(`/companyinfo/${realmId}`),

        // P&L last 8 weeks with weekly breakdown
        qbFetch(
          `/reports/ProfitAndLoss?start_date=${eightWeeksAgo}&end_date=${weekRange.end}&summarize_column_by=Week`
        ),

        // Outstanding invoices (unpaid)
        qbFetch(
          `/query?query=${encodeURIComponent(
            "SELECT Id,DocNumber,CustomerRef,Balance,DueDate FROM Invoice WHERE Balance > '0' ORDER BY DueDate ASC MAXRESULTS 50"
          )}`
        ),

        // This week's invoices (for new vs recurring)
        qbFetch(
          `/query?query=${encodeURIComponent(
            `SELECT Id,DocNumber,CustomerRef,TxnDate,TotalAmt FROM Invoice WHERE TxnDate >= '${weekRange.start}' AND TxnDate <= '${weekRange.end}' MAXRESULTS 200`
          )}`
        ),

        // All invoices from past year (to classify new vs recurring)
        qbFetch(
          `/query?query=${encodeURIComponent(
            `SELECT Id,DocNumber,CustomerRef,TxnDate,TotalAmt FROM Invoice WHERE TxnDate >= '${oneYearAgo}' ORDER BY TxnDate ASC MAXRESULTS 500`
          )}`
        ),

        // Bank accounts for cash position
        qbFetch(
          `/query?query=${encodeURIComponent(
            "SELECT Id,Name,CurrentBalance FROM Account WHERE AccountType = 'Bank' AND Active = true"
          )}`
        ),
      ])

    const dashboardData = buildDashboardData(
      companyInfoRaw as any,
      plRaw as any,
      invoicesRaw as any,
      weekInvoicesRaw as any,
      allInvoicesRaw as any,
      accountsRaw as any,
      weekRange
    )

    return NextResponse.json({ connected: true, data: dashboardData })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Dashboard API error:', message)
    return NextResponse.json({ connected: true, error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/dashboard/route.ts
git commit -m "feat: add dashboard data aggregation API route"
```

---

## Task 11: UI primitives — Card, Badge, KpiCard

**Files:**
- Create: `components/ui/Card.tsx`
- Create: `components/ui/Badge.tsx`
- Create: `components/ui/KpiCard.tsx`

- [ ] **Step 1: Write `components/ui/Card.tsx`**

```tsx
// components/ui/Card.tsx
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-xl shadow-sm border border-gray-100 p-6', className)}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Write `components/ui/Badge.tsx`**

```tsx
// components/ui/Badge.tsx
import { clsx } from 'clsx'
import type { Invoice } from '@/types/dashboard'

const STATUS_STYLES: Record<Invoice['status'], string> = {
  overdue: 'bg-red-100 text-red-700',
  'due-soon': 'bg-amber-100 text-amber-700',
  upcoming: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<Invoice['status'], string> = {
  overdue: 'Overdue',
  'due-soon': 'Due Soon',
  upcoming: 'Upcoming',
}

interface BadgeProps {
  status: Invoice['status']
}

export function Badge({ status }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
```

- [ ] **Step 3: Write `components/ui/KpiCard.tsx`**

```tsx
// components/ui/KpiCard.tsx
import { Card } from './Card'
import { formatCurrency, formatChangePercent } from '@/lib/utils'
import { clsx } from 'clsx'

interface KpiCardProps {
  label: string
  value: string
  changePercent?: number
  subValue?: string
  subValueRed?: boolean
  accentColor?: string  // Tailwind color class e.g. "text-blue-600"
}

export function KpiCard({
  label,
  value,
  changePercent,
  subValue,
  subValueRed,
  accentColor = 'text-gray-900',
}: KpiCardProps) {
  const isPositive = (changePercent ?? 0) >= 0
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
  const changeArrow = isPositive ? '↑' : '↓'

  return (
    <Card>
      <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
      <p className={clsx('text-2xl font-bold', accentColor)}>{value}</p>
      {changePercent !== undefined && (
        <p className={clsx('text-sm mt-1', changeColor)}>
          {changeArrow} {formatChangePercent(Math.abs(changePercent))} vs last week
        </p>
      )}
      {subValue && (
        <p className={clsx('text-sm mt-1', subValueRed ? 'text-red-600' : 'text-gray-500')}>
          {subValue}
        </p>
      )}
    </Card>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/
git commit -m "feat: add Card, Badge, KpiCard UI primitives"
```

---

## Task 12: Header component

**Files:**
- Create: `components/dashboard/Header.tsx`

- [ ] **Step 1: Write `components/dashboard/Header.tsx`**

```tsx
// components/dashboard/Header.tsx
import type { DashboardData } from '@/types/dashboard'

interface HeaderProps {
  companyName: string
  weekLabel: string
  lastUpdated: string
}

export function Header({ companyName, weekLabel, lastUpdated }: HeaderProps) {
  const updated = new Date(lastUpdated)
  const timeStr = updated.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
  const dateStr = updated.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
        <p className="text-gray-500 mt-0.5">{weekLabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Connected
        </span>
        <span className="text-xs text-gray-400">
          Last updated {dateStr} at {timeStr}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/Header.tsx
git commit -m "feat: add Header component"
```

---

## Task 13: KPI row (4 cards)

**Files:**
- Create: `components/dashboard/KpiRow.tsx`

- [ ] **Step 1: Write `components/dashboard/KpiRow.tsx`**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/KpiRow.tsx
git commit -m "feat: add KpiRow with 4 KPI cards"
```

---

## Task 14: Revenue bar chart

**Files:**
- Create: `components/dashboard/RevenueBarChart.tsx`

- [ ] **Step 1: Write `components/dashboard/RevenueBarChart.tsx`**

```tsx
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
            formatter={(val: number) => [formatTooltip(val), 'Revenue']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.isCurrent ? '#2563eb' : '#bfdbfe'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/RevenueBarChart.tsx
git commit -m "feat: add RevenueBarChart component"
```

---

## Task 15: Expenses donut chart

**Files:**
- Create: `components/dashboard/ExpensesDonutChart.tsx`

- [ ] **Step 1: Write `components/dashboard/ExpensesDonutChart.tsx`**

```tsx
// components/dashboard/ExpensesDonutChart.tsx
'use client'

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import type { ExpenseCategory } from '@/types/dashboard'

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#6b7280']

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

interface Props {
  data: ExpenseCategory[]
}

export function ExpensesDonutChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.amount, 0)

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
            formatter={(val: number) => [formatCurrency(val), '']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/ExpensesDonutChart.tsx
git commit -m "feat: add ExpensesDonutChart component"
```

---

## Task 16: Cash flow line chart

**Files:**
- Create: `components/dashboard/CashFlowChart.tsx`

- [ ] **Step 1: Write `components/dashboard/CashFlowChart.tsx`**

```tsx
// components/dashboard/CashFlowChart.tsx
'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
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
            formatter={(val: number, name: string) => [
              formatTooltip(val),
              name === 'cashIn' ? 'Cash In' : 'Cash Out',
            ]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend
            formatter={(val) => (val === 'cashIn' ? 'Cash In' : 'Cash Out')}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="cashIn"
            stroke="#16a34a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="cashOut"
            stroke="#dc2626"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/CashFlowChart.tsx
git commit -m "feat: add CashFlowChart component"
```

---

## Task 17: Profit margin trend chart

**Files:**
- Create: `components/dashboard/ProfitMarginChart.tsx`

- [ ] **Step 1: Write `components/dashboard/ProfitMarginChart.tsx`**

```tsx
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
            formatter={(val: number) => [`${val.toFixed(1)}%`, 'Net Margin']}
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
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/ProfitMarginChart.tsx
git commit -m "feat: add ProfitMarginChart component"
```

---

## Task 18: Sales by Service horizontal bar chart

**Files:**
- Create: `components/dashboard/SalesByServiceChart.tsx`

- [ ] **Step 1: Write `components/dashboard/SalesByServiceChart.tsx`**

```tsx
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
            formatter={(val: number) => [formatCurrency(val), 'Revenue']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#6b7280', formatter: formatCurrency }}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/SalesByServiceChart.tsx
git commit -m "feat: add SalesByServiceChart horizontal bar component"
```

---

## Task 19: New vs Recurring Clients section

**Files:**
- Create: `components/dashboard/NewVsRecurringSection.tsx`

- [ ] **Step 1: Write `components/dashboard/NewVsRecurringSection.tsx`**

```tsx
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
  const total = newClients.revenue + recurringClients.revenue
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
                formatter={(val: number) => [formatCurrency(val), '']}
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
            color="bg-blue-100 text-blue-700"
            dot="bg-blue-600"
          />
          <StatCard
            label="Recurring Clients"
            revenue={recurringClients.revenue}
            count={recurringClients.count}
            color="bg-purple-100 text-purple-700"
            dot="bg-purple-600"
          />
        </div>
      </div>
    </Card>
  )
}

function StatCard({
  label, revenue, count, color, dot,
}: {
  label: string
  revenue: number
  count: number
  color: string
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
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/NewVsRecurringSection.tsx
git commit -m "feat: add NewVsRecurringSection component"
```

---

## Task 20: Outstanding Invoices table

**Files:**
- Create: `components/dashboard/InvoicesTable.tsx`

- [ ] **Step 1: Write `components/dashboard/InvoicesTable.tsx`**

```tsx
// components/dashboard/InvoicesTable.tsx
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import type { Invoice } from '@/types/dashboard'

interface Props {
  invoices: Invoice[]
}

export function InvoicesTable({ invoices }: Props) {
  if (invoices.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Outstanding Invoices</h3>
        <p className="text-sm text-gray-500 text-center py-8">No outstanding invoices.</p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Outstanding Invoices</h3>
      <div className="overflow-x-auto -mx-6 -mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Client
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Invoice #
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Amount
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Due Date
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 font-medium text-gray-900">{inv.clientName}</td>
                <td className="px-6 py-3 text-gray-500">{inv.invoiceNumber}</td>
                <td className="px-6 py-3 text-right font-medium text-gray-900">
                  {formatCurrency(inv.amount)}
                </td>
                <td className="px-6 py-3 text-gray-500">
                  {new Date(inv.dueDate + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </td>
                <td className="px-6 py-3">
                  <Badge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/InvoicesTable.tsx
git commit -m "feat: add InvoicesTable component"
```

---

## Task 21: Dashboard skeleton + loading state

**Files:**
- Create: `components/dashboard/DashboardSkeleton.tsx`
- Create: `app/loading.tsx`

- [ ] **Step 1: Write `components/dashboard/DashboardSkeleton.tsx`**

```tsx
// components/dashboard/DashboardSkeleton.tsx

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
}

function CardSkeleton({ height = 'h-48' }: { height?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <Pulse className="h-4 w-32 mb-4" />
      <Pulse className={height} />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Pulse className="h-7 w-48 mb-2" />
            <Pulse className="h-4 w-32" />
          </div>
          <Pulse className="h-8 w-32 rounded-full" />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <Pulse className="h-4 w-32 mb-3" />
              <Pulse className="h-8 w-24 mb-2" />
              <Pulse className="h-3 w-28" />
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <CardSkeleton height="h-56" />
          <CardSkeleton height="h-56" />
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <CardSkeleton height="h-56" />
          <CardSkeleton height="h-56" />
        </div>

        {/* Sales row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <CardSkeleton height="h-48" />
          <CardSkeleton height="h-48" />
        </div>

        {/* Invoices table */}
        <CardSkeleton height="h-48" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `app/loading.tsx`**

```tsx
// app/loading.tsx
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'

export default function Loading() {
  return <DashboardSkeleton />
}
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/DashboardSkeleton.tsx app/loading.tsx
git commit -m "feat: add DashboardSkeleton and loading state"
```

---

## Task 22: Connect QuickBooks page (unauthenticated state)

**Files:**
- Create: `components/dashboard/ConnectPrompt.tsx`

- [ ] **Step 1: Write `components/dashboard/ConnectPrompt.tsx`**

```tsx
// components/dashboard/ConnectPrompt.tsx

export function ConnectPrompt() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
        <p className="text-gray-500 text-sm mb-6">
          Connect your QuickBooks account to start viewing your weekly financial data.
        </p>
        <a
          href="/api/connect"
          className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Connect QuickBooks
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/ConnectPrompt.tsx
git commit -m "feat: add ConnectPrompt component for unauthenticated state"
```

---

## Task 23: Main page + layout + error boundary

**Files:**
- Modify: `app/globals.css`
- Create/modify: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/error.tsx`

- [ ] **Step 1: Write `app/globals.css`**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f9fafb;
  color: #111827;
}
```

- [ ] **Step 2: Write `app/layout.tsx`**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Financial Dashboard',
  description: 'Weekly financial dashboard powered by QuickBooks',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Write `app/page.tsx`**

```tsx
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
```

- [ ] **Step 4: Write `app/error.tsx`**

```tsx
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx app/page.tsx app/error.tsx
git commit -m "feat: wire up main dashboard page with all components"
```

---

## Task 24: Vercel config, env example, next.config, README

**Files:**
- Create: `vercel.json`
- Create: `.env.example`
- Modify: `next.config.ts`
- Create: `README.md`

- [ ] **Step 1: Write `vercel.json`**

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

- [ ] **Step 2: Write `.env.example`**

```bash
# QuickBooks OAuth credentials (from developer.intuit.com)
QUICKBOOKS_CLIENT_ID=your_client_id_here
QUICKBOOKS_CLIENT_SECRET=your_client_secret_here
QUICKBOOKS_REDIRECT_URI=https://your-app.vercel.app/api/auth/quickbooks

# Next.js secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_random_secret_here

# Vercel KV — auto-populated when you link a KV store in the Vercel dashboard
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

- [ ] **Step 3: Update `next.config.ts`**

Replace the contents of `next.config.ts` with:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

- [ ] **Step 4: Write `README.md`**

```markdown
# Pawsome Financial Dashboard

Weekly financial dashboard connected to QuickBooks. Deploy once to Vercel — everyone with the URL sees live data.

## Setup

### 1. Get QuickBooks API credentials

1. Go to [developer.intuit.com](https://developer.intuit.com) and sign in
2. Click **Create an App** → choose **QuickBooks Online and Payments**
3. Name it "Pawsome Dashboard"
4. Go to **Keys & credentials** → copy **Client ID** and **Client Secret**
5. Under **Redirect URIs**, add: `https://YOUR_APP.vercel.app/api/auth/quickbooks`
   (also add `http://localhost:3000/api/auth/quickbooks` for local dev)
6. Set the app to **Production** mode when ready

### 2. Set up Vercel KV

1. In your Vercel project dashboard → **Storage** tab → **Create Database** → **KV**
2. Name it `dashboard-tokens`, choose your region
3. Click **Connect** — Vercel auto-adds the KV environment variables

### 3. Set environment variables in Vercel

In your Vercel project → **Settings** → **Environment Variables**, add:

| Variable | Value |
|---|---|
| `QUICKBOOKS_CLIENT_ID` | From developer.intuit.com |
| `QUICKBOOKS_CLIENT_SECRET` | From developer.intuit.com |
| `QUICKBOOKS_REDIRECT_URI` | `https://YOUR_APP.vercel.app/api/auth/quickbooks` |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` and paste result |

### 4. Deploy

```bash
npm i -g vercel
vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard for automatic deploys.

### 5. Connect QuickBooks

1. Open your deployed URL
2. Click **Connect QuickBooks**
3. Sign in to QuickBooks and authorize the app
4. You'll be redirected back to the dashboard — done!

The connection persists in Vercel KV. Both users just open the URL.

## Local Development

```bash
cp .env.example .env.local
# Fill in your credentials
vercel dev   # starts local server with KV access
```

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Recharts
- QuickBooks OAuth 2.0
- Vercel KV (token storage)
```

- [ ] **Step 5: Commit**

```bash
git add vercel.json .env.example next.config.ts README.md
git commit -m "chore: add vercel config, env example, and README"
```

---

## Task 25: Run all tests and verify build

- [ ] **Step 1: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: All tests in `__tests__/utils.test.ts` and `__tests__/transform.test.ts` PASS.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Build for production**

```bash
npm run build
```

Expected: Build succeeds with no errors. Note: will show warnings about dynamic routes — that's expected.

- [ ] **Step 4: Smoke test locally**

```bash
npm run dev
```

Open http://localhost:3000. Without KV configured you'll see the **Connect QuickBooks** screen — that's correct.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verified build, tests passing, ready for deploy"
```

---

## Notes

**QB P&L `summarize_column_by=Week` column titles** come back in the format `"Apr 21"` (month + day of the week start). The current week detection in `extractWeeklyRevenue` matches the last money column by label.

**Cash position change %** is set to 0 in this implementation — QB doesn't cheaply provide last-week's bank balance without a second dated query. This can be improved later by storing last week's balance in KV.

**Token refresh** happens automatically in `client.ts` whenever the access token is within 5 minutes of expiry. The new refresh token is always saved back to KV.
```
