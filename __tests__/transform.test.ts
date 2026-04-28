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
