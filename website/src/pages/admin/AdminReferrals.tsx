import { useState, type FormEvent } from 'react'
import { CheckCircle, FloppyDisk } from '@phosphor-icons/react'
import {
  getAgentPayoutSummaries,
  getReferralRedemptions,
  getReferralSettings,
  updateReferralSettings,
  type ReferralSettings,
} from '../../api/referrals'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
import { AgentPayoutsCard, RedemptionsCard, ReferralStats } from '../../components/admin/ReferralPayouts'

/** A settings field that holds what's typed as text: it can be emptied and retyped,
 * has no spinner, and isn't nudged by a stray scroll — unlike `type="number"`. */
function SettingField({
  id,
  label,
  suffix,
  value,
  onChange,
  decimals,
  error,
}: Readonly<{
  id: string
  label: string
  suffix: string
  value: string
  onChange: (value: string) => void
  /** Allow a decimal point (percentages); otherwise whole numbers only. */
  decimals: boolean
  error: string | null
}>) {
  return (
    <div className="w-40">
      <label htmlFor={id} className="block font-label-sm text-label-sm text-on-surface mb-2">
        {label}
      </label>
      <div
        className={`flex items-center min-h-[44px] bg-ivory-base border rounded-lg focus-within:ring-2 focus-within:ring-savanna-green/40 ${
          error ? 'border-error' : 'border-sand-stone'
        }`}
      >
        <input
          id={id}
          type="text"
          inputMode={decimals ? 'decimal' : 'numeric'}
          autoComplete="off"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => onChange(clean(e.target.value, decimals))}
          className="w-full min-w-0 bg-transparent px-4 py-2.5 tabular-nums focus:outline-none"
        />
        <span className="pr-4 text-sm text-on-surface-variant select-none">{suffix}</span>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-error text-xs mt-1">
          {error}
        </p>
      )}
    </div>
  )
}

/** Keeps digits and, for decimals, one point with at most two places (the API's limit). */
function clean(raw: string, decimals: boolean): string {
  if (!decimals) return raw.replace(/\D/g, '').slice(0, 3)
  const [whole, ...rest] = raw.replace(/,/g, '.').replace(/[^\d.]/g, '').split('.')
  return rest.length ? `${whole.slice(0, 3)}.${rest.join('').slice(0, 2)}` : whole.slice(0, 3)
}

function rangeError(value: string, min: number, max: number, what: string): string | null {
  if (value === '' || value === '.') return `Enter ${what}.`
  const n = Number(value)
  return n < min || n > max ? `Between ${min} and ${max}.` : null
}

function SettingsCard() {
  const { data: settings, loading, refetch } = useFetch(getReferralSettings, [])

  if (loading || !settings) {
    return (
      <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone mb-8">
        <p className="text-on-surface-variant text-sm">Loading settings…</p>
      </section>
    )
  }
  // Keyed on the saved values, so the form starts again from them after each save.
  const key = `${settings.discountPercent}-${settings.commissionPercent}-${settings.codeExpiryDays}`
  return <SettingsForm key={key} settings={settings} onSaved={refetch} />
}

function SettingsForm({ settings, onSaved }: Readonly<{ settings: ReferralSettings; onSaved: () => void }>) {
  const [discount, setDiscount] = useState(String(settings.discountPercent))
  const [commission, setCommission] = useState(String(settings.commissionPercent))
  const [expiryDays, setExpiryDays] = useState(String(settings.codeExpiryDays))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const discountError = rangeError(discount, 0, 100, 'a percentage')
  const commissionError = rangeError(commission, 0, 100, 'a percentage')
  const expiryError = rangeError(expiryDays, 1, 730, 'a number of days')
  const unchanged =
    Number(discount) === settings.discountPercent &&
    Number(commission) === settings.commissionPercent &&
    Number(expiryDays) === settings.codeExpiryDays
  const invalid = Boolean(discountError || commissionError || expiryError)

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (invalid) return
    setError(null)
    setSaving(true)
    try {
      await updateReferralSettings({
        discountPercent: Number(discount),
        commissionPercent: Number(commission),
        codeExpiryDays: Number(expiryDays),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  let buttonLabel = 'Save'
  if (saving) buttonLabel = 'Saving…'
  else if (saved) buttonLabel = 'Saved'

  return (
    <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone mb-8">
      <h2 className="font-headline-md text-[20px] text-on-surface mb-1">Rates &amp; rules</h2>
      <p className="text-xs text-on-surface-variant mb-5">What customers save with a code, what agents earn, and how long codes last.</p>
      <form onSubmit={(e) => void handleSave(e)} className="flex flex-wrap items-start gap-4">
        <SettingField
          id="discount-percent"
          label="Tourist discount"
          suffix="%"
          decimals
          value={discount}
          onChange={setDiscount}
          error={discountError}
        />
        <SettingField
          id="commission-percent"
          label="Agent commission"
          suffix="%"
          decimals
          value={commission}
          onChange={setCommission}
          error={commissionError}
        />
        <SettingField
          id="code-expiry-days"
          label="Code valid for"
          suffix="days"
          decimals={false}
          value={expiryDays}
          onChange={setExpiryDays}
          error={expiryError}
        />
        <button
          type="submit"
          disabled={saving || invalid || unchanged}
          className="mt-[28px] min-h-[44px] inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary px-6 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saved ? <CheckCircle size={18} /> : <FloppyDisk size={18} />}
          {buttonLabel}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-error font-label-sm text-label-sm mt-3">
          {error}
        </p>
      )}
      <p className="text-on-surface-variant text-xs mt-3">
        New rates apply to bookings made from now on; commission already earned keeps the rate it was earned at. Code
        validity applies to newly generated codes.
      </p>
    </section>
  )
}

export function AdminReferrals() {
  const { data: redemptions, loading, error, refetch } = useFetch(getReferralRedemptions, [])
  const { data: agents, loading: agentsLoading, refetch: refetchAgents } = useFetch(getAgentPayoutSummaries, [])

  function handlePaid() {
    refetch()
    refetchAgents()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Referrals
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Agents earn commission when a customer books with their code. It becomes payable once that trip is
          completed — pay the agent, then record the payout here.
        </p>
      </div>

      {(loading || agentsLoading) && <p className="text-on-surface-variant text-sm mb-8">Loading…</p>}
      {error && (
        <p role="alert" className="text-error font-label-sm text-label-sm mb-8">
          {error}
        </p>
      )}
      {!loading && !agentsLoading && !error && (
        <>
          <ReferralStats agents={agents ?? []} />
          <AgentPayoutsCard agents={agents ?? []} onPaid={handlePaid} />
          <RedemptionsCard redemptions={redemptions ?? []} onPaid={handlePaid} />
          <SettingsCard />
        </>
      )}
    </div>
  )
}
