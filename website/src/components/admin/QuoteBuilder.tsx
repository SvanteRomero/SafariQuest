import { Lock, PaperPlaneTilt, Plus, Receipt, Trash } from '@phosphor-icons/react'
import type { QuoteLineItemInput } from '../../api/bookings'
import { formatMoney, type Currency } from '../../lib/money'
import { AmountInput } from './AmountInput'

// Mirrors bookings.pricing.DEPOSIT_RATE: what the client pays first, from their account.
const DEPOSIT_RATE = 0.3

function lineTotal(item: QuoteLineItemInput) {
  return item.quantity * item.unitPrice
}

function isComplete(item: QuoteLineItemInput) {
  return item.label.trim() !== '' && item.unitPrice > 0
}

/**
 * The admin's quote for a booking: one row per thing the trip costs, the total, and the
 * deposit the client will be asked for. Saving keeps a draft; sending puts the quote in
 * the client's account, where they pay the deposit. Read-only once a deposit is paid.
 */
export function QuoteBuilder({
  items,
  currency,
  locked,
  sent,
  saving,
  sending,
  onChange,
  onSave,
  onSend,
}: Readonly<{
  items: QuoteLineItemInput[]
  currency: Currency
  locked: boolean
  sent: boolean
  saving: boolean
  sending: boolean
  onChange: (items: QuoteLineItemInput[]) => void
  onSave: () => void
  onSend: () => void
}>) {
  const money = (amount: number) => formatMoney(Math.round(amount), undefined, currency)
  const total = items.reduce((sum, item) => sum + lineTotal(item), 0)
  const deposit = Math.round(total * DEPOSIT_RATE)
  const incomplete = items.some((item) => !isComplete(item))
  const canSubmit = items.length > 0 && !incomplete

  const update = (index: number, patch: Partial<QuoteLineItemInput>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  const add = () => onChange([...items, { label: '', quantity: 1, unitPrice: 0 }])
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))

  return (
    <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
      <header className="flex items-center justify-between gap-4 px-6 py-5 border-b border-sand-stone">
        <div className="flex items-center gap-3">
          <Receipt size={22} className="text-savanna-green" />
          <div>
            <h3 className="font-headline-md text-[18px] text-on-surface leading-tight">Quote Builder</h3>
            <p className="text-xs text-on-surface-variant">Prices in {currency}, the currency the client chose.</p>
          </div>
        </div>
        {locked && (
          <span className="inline-flex items-center gap-1.5 text-xs font-label-sm bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-full">
            <Lock size={12} /> Locked
          </span>
        )}
      </header>

      <div className="px-6 py-5">
        {items.length === 0 ? (
          <div className="text-center border-2 border-dashed border-sand-stone rounded-xl py-10 px-6">
            <p className="font-label-md text-on-surface mb-1">No line items yet</p>
            <p className="text-sm text-on-surface-variant mb-5">
              Add what the trip costs — accommodation, park fees, transport, guide, activities.
            </p>
            {!locked && (
              <button
                type="button"
                onClick={add}
                className="inline-flex items-center gap-1.5 bg-savanna-green text-on-primary min-h-[40px] px-4 rounded-lg font-label-md text-sm hover:opacity-90"
              >
                <Plus size={16} weight="bold" /> Add first item
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_5rem_9rem_7.5rem_2rem] gap-3 pb-2 text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit price</span>
              <span className="text-right">Line total</span>
              <span />
            </div>
            <ul className="space-y-3 sm:space-y-2">
              {items.map((item, i) => {
                const missingLabel = !locked && item.label.trim() === ''
                const missingPrice = !locked && item.unitPrice <= 0
                return (
                  <li
                    key={i}
                    className="grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,1fr)_5rem_9rem_7.5rem_2rem] gap-3 items-center rounded-lg sm:rounded-none bg-surface-container-low sm:bg-transparent p-3 sm:p-0"
                  >
                    <input
                      value={item.label}
                      disabled={locked}
                      placeholder="e.g. 3 nights, tented camp (2 guests)"
                      aria-label={`Item ${i + 1} description`}
                      onChange={(e) => update(i, { label: e.target.value })}
                      className="col-span-2 sm:col-span-1 w-full min-w-0 bg-surface border border-sand-stone rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-savanna-green/40 focus:border-savanna-green disabled:opacity-60"
                    />
                    <AmountInput
                      value={item.quantity}
                      emptyValue={1}
                      disabled={locked}
                      aria-label={`Item ${i + 1} quantity`}
                      onChange={(quantity) => update(i, { quantity: Math.max(1, quantity) })}
                      className="w-20 sm:w-auto"
                    />
                    <AmountInput
                      value={item.unitPrice}
                      prefix={currency}
                      placeholder="0"
                      disabled={locked}
                      aria-label={`Item ${i + 1} unit price`}
                      aria-invalid={missingPrice && item.label.trim() !== ''}
                      onChange={(unitPrice) => update(i, { unitPrice })}
                    />
                    <span className="text-right text-sm font-label-md text-on-surface tabular-nums">
                      {money(lineTotal(item))}
                    </span>
                    {locked ? (
                      <span />
                    ) : (
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        aria-label={`Remove item ${i + 1}`}
                        className="justify-self-end w-8 h-8 inline-flex items-center justify-center rounded-md text-on-surface-variant hover:text-terracotta hover:bg-terracotta/10"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                    {(missingLabel || missingPrice) && (
                      <p className="col-span-2 sm:col-span-5 -mt-1 text-xs text-on-surface-variant">
                        {missingLabel ? 'Add a description' : 'Add a price'} to include this item.
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
            {!locked && (
              <button
                type="button"
                onClick={add}
                className="mt-4 inline-flex items-center gap-1.5 text-savanna-green font-label-md text-sm hover:underline"
              >
                <Plus size={16} weight="bold" /> Add line item
              </button>
            )}
          </>
        )}
      </div>

      <div className="bg-surface-container-low px-6 py-5 border-t border-sand-stone">
        <dl className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between items-baseline">
            <dt className="font-headline-md text-[18px] text-on-surface">Total</dt>
            <dd className="font-headline-md text-[22px] text-savanna-green tabular-nums">{money(total)}</dd>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <dt>Deposit the client pays first (30%)</dt>
            <dd className="tabular-nums">{money(deposit)}</dd>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <dt>Balance before the trip</dt>
            <dd className="tabular-nums">{money(total - deposit)}</dd>
          </div>
        </dl>

        {locked ? (
          <p className="mt-5 text-sm text-on-surface-variant text-right">
            The quote is locked once the client has paid the deposit.
          </p>
        ) : (
          <div className="mt-5 flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !canSubmit}
              className="min-h-[40px] border border-sand-stone bg-surface-container-lowest px-5 rounded-lg font-label-md text-sm hover:bg-surface transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button
              type="button"
              onClick={onSend}
              disabled={sending || !canSubmit}
              title={canSubmit ? undefined : 'Every item needs a description and a price'}
              className="min-h-[40px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-5 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              <PaperPlaneTilt size={16} />
              {sending ? 'Sending…' : sentLabel(sent)}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function sentLabel(sent: boolean) {
  return sent ? 'Update quote for client' : 'Send quote to client'
}
