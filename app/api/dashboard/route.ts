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
    const oneYearAgo = toISODate(new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate())))

    const [companyInfoRaw, plRaw, invoicesRaw, weekInvoicesRaw, allInvoicesRaw, accountsRaw] =
      await Promise.all([
        // Company info endpoint uses realm_id twice in path
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

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const dashboardData = buildDashboardData(
      companyInfoRaw as any,
      plRaw as any,
      invoicesRaw as any,
      weekInvoicesRaw as any,
      allInvoicesRaw as any,
      accountsRaw as any,
      weekRange
    )
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return NextResponse.json({ connected: true, data: dashboardData })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Dashboard API error:', message)
    return NextResponse.json({ connected: true, error: message }, { status: 500 })
  }
}
