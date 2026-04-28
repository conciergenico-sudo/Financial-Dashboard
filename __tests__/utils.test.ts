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
