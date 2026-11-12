import { useState, type FormEvent } from 'react'
import { PAYOUT_METHOD_LABELS, type PayoutInput, type PayoutMethod } from '../../api/referrals'
import { ApiError } from '../../lib/api'

const REFERENCE_HINT: Record<PayoutMethod, string> = {
  mobile_money: 'Transaction ID, e.g. QK7L2M9X1P',
  bank_transfer: 'Bank reference',
  cash: 'Receipt number (optional)',
  other: 'Reference (optional)',
}

/**
 * Records a payout the admin has already sent (mobile money, bank, cash): how, and the
 * reference the agent can match on their side. Nothing is sent from here — the money
 * moves outside the system — so the button says exactly what it records.
 */
export function PayoutForm({
  amountLabel,
  defaultMethod,
  onSubmit,
  onCancel,
}: Readonly<{
  /** e.g. "USD 340" — what this payout covers. */
  amountLabel: string
  defaultMethod?: PayoutMethod
  onSubmit: (payout: PayoutInput) => Promise<void>
  onCancel: () => void
}>) {
  const [method, setMethod] = useState<PayoutMethod>(defaultMethod ?? 'mobile_money')
  const [reference, setReference] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const referenceRequired = method === 'mobile_money' || method === 'bank_transfer'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSubmit({ method, reference: reference.trim() })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mt-3 rounded-lg border border-savanna-green/30 bg-savanna-green/5 p-4 space-y-3"
    >
      <p className="text-sm text-on-surface">
        Record a payout of <strong>{amountLabel}</strong> you've already sent. The agent sees it in their portal.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-3">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as PayoutMethod)}
          aria-label="Payout method"
          className="min-h-[40px] bg-surface border border-sand-stone rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-savanna-green/40"
        >
          {(Object.keys(PAYOUT_METHOD_LABELS) as PayoutMethod[]).map((key) => (
            <option key={key} value={key}>
              {PAYOUT_METHOD_LABELS[key]}
            </option>
          ))}
        </select>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          required={referenceRequired}
          maxLength={100}
          placeholder={REFERENCE_HINT[method]}
          aria-label="Payout reference"
          className="min-h-[40px] bg-surface border border-sand-stone rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-savanna-green/40"
        />
      </div>
      {error && (
        <p role="alert" className="text-error text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[36px] px-4 rounded-lg text-sm font-label-md text-on-surface-variant hover:text-on-surface"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="min-h-[36px] px-4 rounded-lg text-sm font-label-md bg-savanna-green text-on-primary hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Recording…' : `Record ${amountLabel} paid`}
        </button>
      </div>
    </form>
  )
}
