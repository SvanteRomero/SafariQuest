import { useState, type FormEvent } from 'react'
import { CheckCircle, Wallet } from '@phosphor-icons/react'
import { getMyPayoutDetails, saveMyPayoutDetails, type AgentPayoutDetails } from '../../api/referrals'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

const INPUT_CLASS =
  'w-full min-h-[44px] bg-surface border border-sand-stone rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-savanna-green/40'

const DETAILS_HINT: Record<AgentPayoutDetails['method'], { label: string; placeholder: string }> = {
  mobile_money: { label: 'Mobile money number', placeholder: 'e.g. M-Pesa 0754 123 456' },
  bank_transfer: { label: 'Bank and account number', placeholder: 'e.g. CRDB Bank, 0150 1234 5678 00, Arusha branch' },
}

/** Where the agent wants their commission sent — shown to the admin who pays them. */
export function PayoutDetailsCard() {
  const { data: saved, loading, refetch } = useFetch(getMyPayoutDetails, [])
  if (loading) return null
  // Keyed on the saved version so the form starts from what's stored after each save.
  return <PayoutDetailsForm key={saved?.updatedAt ?? 'new'} saved={saved} onSaved={refetch} />
}

function PayoutDetailsForm({ saved, onSaved }: Readonly<{ saved: AgentPayoutDetails | null; onSaved: () => void }>) {
  const [method, setMethod] = useState<AgentPayoutDetails['method']>(saved?.method ?? 'mobile_money')
  const [accountName, setAccountName] = useState(saved?.accountName ?? '')
  const [accountDetails, setAccountDetails] = useState(saved?.accountDetails ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await saveMyPayoutDetails({ method, accountName: accountName.trim(), accountDetails: accountDetails.trim() })
      setJustSaved(true)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-ivory-base rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
      <h2 className="font-headline-md text-[20px] text-on-surface mb-1 flex items-center gap-2">
        <Wallet size={22} className="text-savanna-green" />
        How you get paid
      </h2>
      <p className="text-sm text-on-surface-variant mb-5">
        {saved
          ? 'We send your commission here once each referred trip is completed.'
          : "Add where we should send your commission. You'll be paid once each referred trip is completed."}
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <fieldset className="flex flex-wrap gap-3">
          <legend className="sr-only">Payout method</legend>
          {(['mobile_money', 'bank_transfer'] as const).map((key) => (
            <label
              key={key}
              className={`flex items-center gap-2 rounded-lg border px-4 min-h-[44px] cursor-pointer text-sm ${
                method === key ? 'border-savanna-green bg-savanna-green/5' : 'border-sand-stone'
              }`}
            >
              <input
                type="radio"
                name="payout-method"
                value={key}
                checked={method === key}
                onChange={() => setMethod(key)}
                className="accent-savanna-green"
              />
              {key === 'mobile_money' ? 'Mobile money' : 'Bank transfer'}
            </label>
          ))}
        </fieldset>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="payout-account-name" className="block text-xs font-label-md text-on-surface-variant mb-1.5">
              Account holder's name
            </label>
            <input
              id="payout-account-name"
              required
              maxLength={150}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="payout-account-details" className="block text-xs font-label-md text-on-surface-variant mb-1.5">
              {DETAILS_HINT[method].label}
            </label>
            <input
              id="payout-account-details"
              required
              maxLength={255}
              value={accountDetails}
              placeholder={DETAILS_HINT[method].placeholder}
              onChange={(e) => setAccountDetails(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-error text-sm">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] px-6 rounded-lg bg-savanna-green text-on-primary font-label-md text-sm hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save payout details'}
          </button>
          {justSaved && (
            <span className="inline-flex items-center gap-1 text-sm text-savanna-green">
              <CheckCircle size={16} weight="fill" /> Saved
            </span>
          )}
        </div>
      </form>
    </section>
  )
}
