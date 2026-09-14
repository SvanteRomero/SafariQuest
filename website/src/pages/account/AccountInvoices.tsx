import { CreditCard } from '@phosphor-icons/react'
import { getMyInvoices, INVOICE_STATUS_LABELS, type InvoiceStatus } from '../../api/invoices'
import { useFetch } from '../../lib/useFetch'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  unpaid: 'bg-surface-container text-on-surface-variant',
  deposit_paid: 'bg-golden-sun/20 text-secondary',
  paid: 'bg-savanna-green/15 text-savanna-green',
  overdue: 'bg-error-container text-error',
}

export function AccountInvoices() {
  const { data: invoices, loading, error } = useFetch(getMyInvoices, [])
  const allInvoices = invoices ?? []

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
          Invoices &amp; Payments
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Review deposit and balance invoices for each of your safaris.
        </p>
      </div>

      {loading && <p className="text-center text-on-surface-variant py-10">Loading…</p>}
      {error && <p className="text-center text-error py-10">{error}</p>}

      {!loading && !error && allInvoices.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-10 shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant text-center">
          <CreditCard size={40} className="text-on-surface-variant mx-auto mb-4" />
          <p className="font-headline-md text-headline-md text-on-surface mb-2">No payments yet</p>
          <p className="text-on-surface-variant max-w-md mx-auto">
            A deposit invoice appears here as soon as you pay one at checkout, or once your safari specialist sends
            you a quote to pay.
          </p>
        </div>
      )}

      {!loading && !error && allInvoices.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Package</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Issued</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-stone">
                {allInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4 font-label-md text-sm text-on-surface">{invoice.packageTitle}</td>
                    <td className="px-5 py-4 text-sm text-on-surface">${invoice.amount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{invoice.issuedDate}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{invoice.dueDate}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-label-sm ${STATUS_STYLES[invoice.status]}`}>
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
