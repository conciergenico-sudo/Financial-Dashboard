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

// Returns the Monday of the week containing `date`, operating in UTC
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day // Sunday = 0, shift back to Monday
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getWeekRange(date: Date): { start: string; end: string; label: string } {
  const monday = getMondayOfWeek(date)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  const start = toISODate(monday)
  const end = toISODate(sunday)

  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  const yearFmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' })
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
