import { useMemo, useState, type ComponentType } from 'react'
import {
  Bank,
  CheckCircle,
  Clock,
  DeviceMobile,
  HandCoins,
  MagnifyingGlass,
  Users,
  Wallet,
  Warning,
} from '@phosphor-icons/react'
import {
  markCommissionPaid,
  payAgent,
  PAYOUT_METHOD_LABELS,
  type AgentPayoutSummary,
  type CommissionTotals,
  type ReferralRedemption,
} from '../../api/referrals'
import { STAGE_LABELS } from '../../api/bookings'
import { emptyTotals, formatMoney, formatTotals, type Currency, type MoneyTotals } from '../../lib/money'
import { PayoutForm } from './PayoutForm'

const CARD = 'bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)).toUpperCase()
}

type TotalsByCurrency = AgentPayoutSummary['totals']

function totalsOf(totals: TotalsByCurrency, pick: (t: CommissionTotals) => number): MoneyTotals {
  const sum = emptyTotals()
  for (const [currency, t] of Object.entries(totals) as [Currency, CommissionTotals][]) sum[currency] += pick(t)
  return sum
}

function hasAny(totals: MoneyTotals) {
  return totals.TZS > 0 || totals.USD > 0
}

/* ---------------------------------------------------------------- summary strip */

/** The four numbers an admin opens this page for, across every agent. */
export function ReferralStats({ agents }: Readonly<{ agents: AgentPayoutSummary[] }>) {
  const all = (pick: (t: CommissionTotals) => number) => {
    const sum = emptyTotals()
    for (const agent of agents) {
      const own = totalsOf(agent.totals, pick)
      sum.TZS += own.TZS
      sum.USD += own.USD
    }
    return sum
  }
  const payable = all((t) => t.payable)
  const awaiting = all((t) => t.awaiting)
  const paid = all((t) => t.paid)
  const agentsDue = agents.filter((a) => hasAny(totalsOf(a.totals, (t) => t.payable))).length
  const referrals = agents.reduce((n, a) => n + a.referrals, 0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <Stat
        icon={Wallet}
        tone="green"
        label="Payable now"
        value={hasAny(payable) ? formatTotals(payable) : 'Nothing due'}
        note={agentsDue ? `${agentsDue} agent${agentsDue === 1 ? '' : 's'} to pay` : 'All agents are paid up'}
      />
      <Stat
        icon={Clock}
        tone="gold"
        label="Awaiting trips"
        value={hasAny(awaiting) ? formatTotals(awaiting) : '—'}
        note="Payable once each trip is completed"
      />
      <Stat
        icon={CheckCircle}
        tone="neutral"
        label="Paid out"
        value={hasAny(paid) ? formatTotals(paid) : '—'}
        note="All time"
      />
      <Stat
        icon={Users}
        tone="neutral"
        label="Referred bookings"
        value={String(referrals)}
        note={`From ${agents.length} agent${agents.length === 1 ? '' : 's'}`}
      />
    </div>
  )
}

const TONE: Record<'green' | 'gold' | 'neutral', { icon: string; value: string }> = {
  green: { icon: 'bg-savanna-green/10 text-savanna-green', value: 'text-savanna-green' },
  gold: { icon: 'bg-golden-sun/15 text-golden-sun', value: 'text-on-surface' },
  neutral: { icon: 'bg-surface-container text-on-surface-variant', value: 'text-on-surface' },
}

function Stat({
  icon: Icon,
  tone,
  label,
  value,
  note,
}: Readonly<{ icon: ComponentType<{ size?: number }>; tone: keyof typeof TONE; label: string; value: string; note: string }>) {
  return (
    <div className={`${CARD} p-5 flex gap-4`}>
      <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${TONE[tone].icon}`}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant">{label}</p>
        <p className={`font-headline-md text-[20px] leading-tight mt-1 [overflow-wrap:anywhere] ${TONE[tone].value}`}>{value}</p>
        <p className="text-xs text-on-surface-variant mt-1">{note}</p>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- agent payouts */

/**
 * One row per agent: where to send their money, what's payable now (trips completed),
 * what waits on a trip, and what's been paid. "Record payout" settles everything payable
 * in one currency at once — the usual periodic payout run, rather than booking by booking.
 */
export function AgentPayoutsCard({
  agents,
  onPaid,
}: Readonly<{ agents: AgentPayoutSummary[]; onPaid: () => void }>) {
  const [paying, setPaying] = useState<{ agentId: number; currency: Currency } | null>(null)
  const due = (a: AgentPayoutSummary) => totalsOf(a.totals, (t) => t.payable)
  const anyDue = agents.some((a) => hasAny(due(a)))
  const [onlyDue, setOnlyDue] = useState(anyDue)

  // Who's owed most first (USD and TZS can't be added, so USD then TZS as a tiebreak).
  const sorted = [...agents].sort((a, b) => due(b).USD - due(a).USD || due(b).TZS - due(a).TZS)
  const shown = onlyDue ? sorted.filter((a) => hasAny(due(a))) : sorted

  return (
    <section className={`${CARD} mb-8 overflow-hidden`}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-sand-stone">
        <div className="flex items-center gap-3">
          <HandCoins size={22} className="text-savanna-green" />
          <div>
            <h2 className="font-headline-md text-[20px] text-on-surface leading-tight">Agent payouts</h2>
            <p className="text-xs text-on-surface-variant">Send the money first, then record it here.</p>
          </div>
        </div>
        {agents.length > 0 && (
          <label className="inline-flex items-center gap-2 text-sm text-on-surface cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyDue}
              onChange={(e) => setOnlyDue(e.target.checked)}
              className="accent-savanna-green w-4 h-4"
            />
            Only agents with money due
          </label>
        )}
      </header>

      {shown.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-on-surface-variant">
          {agents.length === 0 ? 'No agent has had a code used yet.' : 'Every agent is paid up. Nothing to send right now.'}
        </p>
      ) : (
        <ul className="divide-y divide-sand-stone">
          {shown.map((agent) => (
            <AgentRow
              key={agent.agentId}
              agent={agent}
              paying={paying?.agentId === agent.agentId ? paying.currency : null}
              onStartPaying={(currency) => setPaying({ agentId: agent.agentId, currency })}
              onCancel={() => setPaying(null)}
              onPaid={() => {
                setPaying(null)
                onPaid()
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function AgentRow({
  agent,
  paying,
  onStartPaying,
  onCancel,
  onPaid,
}: Readonly<{
  agent: AgentPayoutSummary
  paying: Currency | null
  onStartPaying: (currency: Currency) => void
  onCancel: () => void
  onPaid: () => void
}>) {
  const payable = totalsOf(agent.totals, (t) => t.payable)
  const awaiting = totalsOf(agent.totals, (t) => t.awaiting)
  const paid = totalsOf(agent.totals, (t) => t.paid)
  const payableCurrencies = (['USD', 'TZS'] as const).filter((c) => payable[c] > 0)
  const details = agent.payoutDetails
  const MethodIcon = details?.method === 'bank_transfer' ? Bank : DeviceMobile

  return (
    <li className="px-6 py-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-start gap-3 lg:w-[34%] min-w-0">
          <span className="w-10 h-10 rounded-full bg-savanna-green/10 text-savanna-green font-label-md text-sm flex items-center justify-center shrink-0">
            {initials(agent.name || agent.email)}
          </span>
          <div className="min-w-0">
            <p className="font-label-md text-on-surface truncate">{agent.name || agent.email}</p>
            <p className="text-xs text-on-surface-variant truncate">
              {agent.email} · {agent.referrals} referral{agent.referrals === 1 ? '' : 's'}
            </p>
            {details ? (
              <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-on-surface bg-surface-container-low rounded-md px-2 py-1 max-w-full">
                <MethodIcon size={14} className="mt-px shrink-0 text-on-surface-variant" />
                <span className="[overflow-wrap:anywhere]">
                  {details.accountDetails} · {details.accountName}
                </span>
              </p>
            ) : (
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-terracotta">
                <Warning size={14} /> No payout details — ask the agent to add them
              </p>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-4 flex-1">
          <Figure label="Payable now" value={payable} strong />
          <Figure label="Awaiting trip" value={awaiting} />
          <Figure label="Paid to date" value={paid} />
        </dl>

        <div className="flex flex-wrap gap-2 lg:w-48 lg:justify-end">
          {payableCurrencies.map((currency) => (
            <button
              key={currency}
              type="button"
              onClick={() => onStartPaying(currency)}
              disabled={paying !== null}
              className="min-h-[36px] px-3 rounded-lg text-sm font-label-md bg-savanna-green text-on-primary hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              Pay {formatMoney(payable[currency], undefined, currency)}
            </button>
          ))}
        </div>
      </div>

      {paying && (
        <PayoutForm
          amountLabel={formatMoney(payable[paying], undefined, paying)}
          defaultMethod={details?.method}
          onCancel={onCancel}
          onSubmit={async (payout) => {
            await payAgent(agent.agentId, paying, payout)
            onPaid()
          }}
        />
      )}
    </li>
  )
}

function Figure({ label, value, strong }: Readonly<{ label: string; value: MoneyTotals; strong?: boolean }>) {
  const empty = !hasAny(value)
  let valueClass = 'text-sm text-on-surface'
  if (empty) valueClass = 'text-sm text-on-surface-variant/60'
  else if (strong) valueClass = 'font-headline-md text-[17px] text-savanna-green'
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant mb-1">{label}</dt>
      <dd className={`${valueClass} [overflow-wrap:anywhere]`}>{empty ? '—' : formatTotals(value)}</dd>
    </div>
  )
}

/* ---------------------------------------------------------------- redemptions */

type Filter = 'all' | 'payable' | 'awaiting' | 'paid'

const FILTERS: { key: Filter; label: string; keep: (r: ReferralRedemption) => boolean }[] = [
  { key: 'all', label: 'All', keep: () => true },
  { key: 'payable', label: 'Payable now', keep: (r) => r.payable },
  { key: 'awaiting', label: 'Awaiting trip', keep: (r) => r.commissionStatus === 'pending' && !r.payable },
  { key: 'paid', label: 'Paid', keep: (r) => r.commissionStatus === 'paid' },
]

function matches(r: ReferralRedemption, query: string) {
  if (!query) return true
  const haystack = [r.agentName, r.agentEmail, r.code, r.customerName, r.customerEmail, `#${r.bookingId}`, String(r.bookingId)]
    .join(' ')
    .toLowerCase()
  return haystack.includes(query.toLowerCase())
}

/** Every redemption — whose code, which booking, where the trip stands, and the payout. */
export function RedemptionsCard({
  redemptions,
  onPaid,
}: Readonly<{ redemptions: ReferralRedemption[]; onPaid: () => void }>) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [payingId, setPayingId] = useState<number | null>(null)

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, redemptions.filter(f.keep).length])) as Record<Filter, number>,
    [redemptions],
  )
  const keep = (FILTERS.find((f) => f.key === filter) ?? FILTERS[0]).keep
  const shown = redemptions.filter((r) => keep(r) && matches(r, query.trim()))

  return (
    <section className={`${CARD} mb-8 overflow-hidden`}>
      <header className="px-6 py-5 border-b border-sand-stone space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-headline-md text-[20px] text-on-surface">Redemptions</h2>
          <label className="relative w-full sm:w-72">
            <span className="sr-only">Search redemptions</span>
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Agent, code, customer or booking #"
              className="w-full min-h-[40px] bg-surface border border-sand-stone rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-savanna-green/40"
            />
          </label>
        </div>
        <div role="group" aria-label="Filter redemptions" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`min-h-[34px] px-3 rounded-full text-sm font-label-md border transition-colors ${
                filter === f.key
                  ? 'bg-savanna-green text-on-primary border-savanna-green'
                  : 'border-sand-stone text-on-surface-variant hover:border-savanna-green hover:text-savanna-green'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs ${filter === f.key ? 'opacity-80' : 'opacity-60'}`}>{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </header>

      {shown.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-on-surface-variant">
          {redemptions.length === 0 ? 'No referral codes have been redeemed yet.' : 'Nothing matches this filter.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low">
              <tr className="text-on-surface-variant text-[11px] font-label-sm uppercase tracking-wider">
                <th className="py-3 pl-6 pr-4 font-medium">Agent & code</th>
                <th className="py-3 pr-4 font-medium">Customer</th>
                <th className="py-3 pr-4 font-medium">Trip</th>
                <th className="py-3 pr-4 font-medium text-right">Commission</th>
                <th className="py-3 pr-6 font-medium">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-stone">
              {shown.map((r) => (
                <tr key={r.id} className="align-top hover:bg-surface-container-low/50">
                  <td className="py-4 pl-6 pr-4">
                    <p className="font-label-md text-on-surface">{r.agentName || r.agentEmail}</p>
                    <p className="text-xs text-on-surface-variant font-mono tracking-wider mt-0.5">{r.code}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="text-on-surface">{r.customerName || r.customerEmail}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Booking #{r.bookingId}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="text-on-surface">{STAGE_LABELS[r.tripStage]}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Ends {formatDate(r.tripEndDate)}</p>
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <p className="font-label-md text-on-surface tabular-nums">
                      {formatMoney(r.commissionAmount, undefined, r.currency)}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5 tabular-nums">
                      {r.commissionPercent}% of {formatMoney(r.tripTotal, undefined, r.currency)}
                    </p>
                  </td>
                  <td className="py-4 pr-6 min-w-[13rem]">
                    <PayoutCell
                      redemption={r}
                      open={payingId === r.id}
                      onOpen={() => setPayingId(r.id)}
                      onClose={() => setPayingId(null)}
                      onPaid={onPaid}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

const BADGE = {
  paid: 'bg-savanna-green/10 text-savanna-green border-savanna-green/20',
  payable: 'bg-terracotta/10 text-terracotta border-terracotta/20',
  awaiting: 'bg-golden-sun/10 text-golden-sun border-golden-sun/20',
}

function Badge({ tone, children }: Readonly<{ tone: keyof typeof BADGE; children: string }>) {
  return (
    <span className={`inline-flex items-center py-0.5 px-2 rounded-md border text-xs font-label-md ${BADGE[tone]}`}>
      {children}
    </span>
  )
}

function PayoutCell({
  redemption: r,
  open,
  onOpen,
  onClose,
  onPaid,
}: Readonly<{ redemption: ReferralRedemption; open: boolean; onOpen: () => void; onClose: () => void; onPaid: () => void }>) {
  if (r.commissionStatus === 'paid') {
    return (
      <div>
        <Badge tone="paid">Paid</Badge>
        {r.paidAt && (
          <p className="text-xs text-on-surface-variant mt-1">
            {formatDate(r.paidAt)}
            {r.payoutMethod && ` · ${PAYOUT_METHOD_LABELS[r.payoutMethod]}`}
          </p>
        )}
        {r.payoutReference && <p className="text-xs text-on-surface-variant font-mono">{r.payoutReference}</p>}
      </div>
    )
  }
  if (!r.payable) {
    return (
      <div>
        <Badge tone="awaiting">Awaiting trip</Badge>
        <p className="text-xs text-on-surface-variant mt-1">Payable once the trip is completed</p>
      </div>
    )
  }
  if (open) {
    return (
      <PayoutForm
        amountLabel={formatMoney(r.commissionAmount, undefined, r.currency)}
        onCancel={onClose}
        onSubmit={async (payout) => {
          await markCommissionPaid(r.id, payout)
          onClose()
          onPaid()
        }}
      />
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="payable">Payable</Badge>
      <button type="button" onClick={onOpen} className="text-xs font-label-md text-savanna-green hover:underline">
        Record payout
      </button>
    </div>
  )
}
