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
