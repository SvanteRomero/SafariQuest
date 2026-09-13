import { CreditCard } from '@phosphor-icons/react'

export function AccountInvoices() {
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

      <div className="bg-surface-container-lowest rounded-xl p-10 shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant text-center">
        <CreditCard size={40} className="text-on-surface-variant mx-auto mb-4" />
        <p className="font-headline-md text-headline-md text-on-surface mb-2">Invoicing isn&apos;t set up yet</p>
        <p className="text-on-surface-variant max-w-md mx-auto">
          Deposit and balance invoices aren&apos;t generated yet. Your safari specialist will send payment details
          directly once your quote is confirmed.
        </p>
      </div>
    </div>
  )
}
