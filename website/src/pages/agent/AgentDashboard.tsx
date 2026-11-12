import { useState, type FormEvent } from 'react'
import { ArrowSquareOut, Copy, HandCoins } from '@phosphor-icons/react'
import {
  generateReferralCode,
  getMyReferralCodes,
  PAYOUT_METHOD_LABELS,
  type ReferralCode,
  type ReferralRedemptionSummary,
} from '../../api/referrals'
import { PayoutDetailsCard } from '../../components/agent/PayoutDetailsCard'
import { useFetch } from '../../lib/useFetch'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../lib/api'
import { formatMoney, formatTotals, sumByCurrency } from '../../lib/money'

const STATUS_BADGE: Record<ReferralCode['status'], string> = {
  active: 'bg-savanna-green/10 text-savanna-green border border-savanna-green/20',
  used: 'bg-secondary-container/20 text-secondary border border-secondary-container/40',
  expired: 'bg-surface-dim text-on-surface-variant border border-outline-variant',
}

const COMMISSION_BADGE: Record<'pending' | 'paid', string> = {
  pending: 'bg-golden-sun/10 text-golden-sun border border-golden-sun/20',
  paid: 'bg-savanna-green/10 text-savanna-green border border-savanna-green/20',
}

/** Where a commission stands, in a few words under its amount. */
function commissionNote(r: ReferralRedemptionSummary): string {
  if (r.commissionStatus === 'paid') {
    const how = r.payoutMethod ? ` by ${PAYOUT_METHOD_LABELS[r.payoutMethod].toLowerCase()}` : ''
    const ref = r.payoutReference ? ` · ref ${r.payoutReference}` : ''
    return r.paidAt ? `Paid ${formatDate(r.paidAt)}${how}${ref}` : 'Paid'
  }
  return r.tripCompleted ? 'Trip completed — in our next payout' : 'Earned once the trip is completed'
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function AgentDashboard() {
  const { user } = useAuth()
  const { data: codes, loading, error, refetch } = useFetch(getMyReferralCodes, [])
  const [contactName, setContactName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [justGenerated, setJustGenerated] = useState<ReferralCode | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGenerateError(null)
    setGenerating(true)
    try {
      const code = await generateReferralCode(contactName || undefined)
      setJustGenerated(code)
      setContactName('')
      setCopied(false)
      refetch()
    } catch (err) {
      setGenerateError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy(code: string) {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const list = codes ?? []
  // Commission is in each booking's currency, so it's totalled per currency.
  const redemptions = list.flatMap((c) => (c.redemption ? [c.redemption] : []))
  const commissionTotal = (keep: (r: ReferralRedemptionSummary) => boolean) =>
    sumByCurrency(redemptions.filter(keep), (r) => r.commissionAmount, (r) => r.currency)
  // Earned once the referred trip is completed; until then it waits on the trip.
  const readyCommission = commissionTotal((r) => r.commissionStatus === 'pending' && r.tripCompleted)
  const awaitingCommission = commissionTotal((r) => r.commissionStatus === 'pending' && !r.tripCompleted)
  const paidCommission = commissionTotal((r) => r.commissionStatus === 'paid')

  return (
    <div className="space-y-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
            Welcome, {user?.name || user?.email}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Generate a referral code for each contact you refer. They get a discount, you earn a commission when they
            book.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-ivory-base rounded-xl p-6 shadow-sm border border-sand-stone">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
              Awaiting Trip
            </p>
            <p className="font-headline-md text-[24px] text-on-surface">{formatTotals(awaitingCommission)}</p>
            <p className="text-xs text-on-surface-variant mt-1">Earned once the trip is completed</p>
          </div>
          <div className="bg-ivory-base rounded-xl p-6 shadow-sm border border-sand-stone">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
              Ready to Be Paid
            </p>
            <p className="font-headline-md text-[24px] text-golden-sun">{formatTotals(readyCommission)}</p>
            <p className="text-xs text-on-surface-variant mt-1">Included in our next payout</p>
          </div>
          <div className="bg-ivory-base rounded-xl p-6 shadow-sm border border-sand-stone">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
              Paid Out
            </p>
            <p className="font-headline-md text-[24px] text-savanna-green">{formatTotals(paidCommission)}</p>
          </div>
        </div>

        <PayoutDetailsCard />

        <section className="bg-ivory-base rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
          <h2 className="font-headline-md text-[20px] text-on-surface mb-4 flex items-center gap-2">
            <HandCoins size={22} className="text-savanna-green" />
            Generate a Referral Code
          </h2>
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Who is this for? (optional)"
              className="flex-1 min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
            />
            <button
              type="submit"
              disabled={generating}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary px-6 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating…' : 'Generate Code'}
            </button>
          </form>
          {generateError && (
            <p role="alert" className="text-error font-label-sm text-label-sm mt-3">
              {generateError}
            </p>
          )}
          {justGenerated && (
            <div className="mt-5 flex items-center justify-between gap-4 bg-savanna-green/10 border border-savanna-green/20 rounded-lg px-5 py-4">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Share this code</p>
                <p className="font-headline-md text-[24px] tracking-widest text-savanna-green">{justGenerated.code}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  Expires {formatDate(justGenerated.expiresAt)} — single use
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(justGenerated.code)}
                className="inline-flex items-center gap-2 text-savanna-green hover:opacity-80 transition-opacity font-label-md text-label-md"
              >
                <Copy size={18} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </section>

        <section className="bg-ivory-base rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
          <h2 className="font-headline-md text-[20px] text-on-surface mb-5">Your Codes</h2>
          {loading && <p className="text-on-surface-variant text-sm">Loading…</p>}
          {error && (
            <p role="alert" className="text-error font-label-sm text-label-sm">
              {error}
            </p>
          )}
          {!loading && !error && list.length === 0 && (
            <p className="text-on-surface-variant text-sm">You haven't generated any referral codes yet.</p>
          )}
          {!loading && list.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-sand-stone text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">For</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Booking</th>
                    <th className="py-2 pr-4">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="border-b border-sand-stone last:border-0">
                      <td className="py-3 pr-4 font-label-md tracking-wider">{c.code}</td>
                      <td className="py-3 pr-4 text-on-surface-variant">{c.contactName || '—'}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center py-1 px-2.5 rounded-md text-xs ${STATUS_BADGE[c.status]}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-on-surface-variant">
                        {c.redemption ? (
                          <span className="inline-flex items-center gap-1">
                            #{c.redemption.bookingId} <ArrowSquareOut size={14} />
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {c.redemption ? (
                          <div>
                            <span className="inline-flex items-center gap-2">
                              {formatMoney(c.redemption.commissionAmount, undefined, c.redemption.currency)}
                              <span
                                className={`inline-flex items-center py-0.5 px-2 rounded-md text-xs ${COMMISSION_BADGE[c.redemption.commissionStatus]}`}
                              >
                                {c.redemption.commissionStatus}
                              </span>
                            </span>
                            <p className="text-xs text-on-surface-variant mt-1">{commissionNote(c.redemption)}</p>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </div>
  )
}
