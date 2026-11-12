import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, Kanban, MagnifyingGlass, PaperPlaneTilt, Table, Users, X } from '@phosphor-icons/react'
import { getBookings, STAGE_LABELS, STAGE_ORDER, type Booking, type BookingStage } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'
import { formatMoney } from '../../lib/money'

type View = 'board' | 'table'
const VIEW_KEY = 'admin.pipeline.view'

const STAGE_DOT: Record<BookingStage, string> = {
  new_inquiry: 'bg-secondary-container',
  quoted: 'bg-golden-sun',
  deposit_paid: 'bg-primary-fixed-dim',
  confirmed: 'bg-savanna-green',
  completed: 'bg-terracotta',
}

const STAGE_BADGE: Record<BookingStage, string> = {
  new_inquiry: 'bg-secondary-container/30 text-on-surface',
  quoted: 'bg-golden-sun/15 text-on-surface',
  deposit_paid: 'bg-primary-fixed-dim/30 text-on-surface',
  confirmed: 'bg-savanna-green/15 text-savanna-green',
  completed: 'bg-terracotta/10 text-terracotta',
}

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'board'
  } catch {
    return 'board'
  }
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** "6 – 13 Nov 2026", or across months "28 Nov – 4 Dec 2026". */
function formatRange(start: string, end: string) {
  const s = new Date(`${start}T00:00:00`)
  const e = new Date(`${end}T00:00:00`)
  const day = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric' })
  const dayMonth = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  const full = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  if (s.getFullYear() !== e.getFullYear()) return `${full(s)} – ${full(e)}`
  if (s.getMonth() !== e.getMonth()) return `${dayMonth(s)} – ${full(e)}`
  return `${day(s)} – ${full(e)}`
}

/** What the team does next with a booking — the line that makes the board a to-do list. */
function nextStep(b: Booking): { label: string; urgent: boolean } {
  switch (b.stage) {
    case 'new_inquiry':
      return b.quoteRequested ? { label: 'Build & send quote', urgent: true } : { label: 'Awaiting deposit', urgent: false }
    case 'quoted':
      return { label: 'Waiting for deposit', urgent: false }
    case 'deposit_paid':
      return b.assignedGuideName ? { label: 'Waiting for balance', urgent: false } : { label: 'Assign a guide', urgent: true }
    case 'confirmed':
      return b.assignedGuideName ? { label: 'Ready to travel', urgent: false } : { label: 'Assign a guide', urgent: true }
    default:
      return { label: 'Trip completed', urgent: false }
  }
}

/** The figure worth showing: the quote or trip total, or a plain "not quoted yet". */
function amountLabel(b: Booking) {
  if (b.subtotal > 0) return formatMoney(b.subtotal, undefined, b.currency)
  return b.quoteRequested ? 'Not quoted yet' : '—'
}

function matches(b: Booking, query: string) {
  if (!query) return true
  return [b.customerName, b.customerEmail, b.packageTitle, b.region, `#${b.id}`, String(b.id)]
    .join(' ')
    .toLowerCase()
    .includes(query.toLowerCase())
}

export function AdminBookingsPipeline() {
  const [view, setView] = useState<View>(readView)
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('All')
  const [guide, setGuide] = useState<'All' | 'Unassigned'>('All')
  const [stage, setStage] = useState<BookingStage | 'all'>('all')

  // Loaded once and filtered here: the list is small, and regions come from the real
  // bookings rather than a hard-coded list that drifts from the data.
  const { data: bookings, loading, error } = useFetch(() => getBookings(), [])
  const all = useMemo(() => bookings ?? [], [bookings])
  const regions = useMemo(() => [...new Set(all.map((b) => b.region))].sort((a, b) => a.localeCompare(b)), [all])

  const filtered = all.filter(
    (b) =>
      matches(b, query.trim()) &&
      (region === 'All' || b.region === region) &&
      (guide === 'All' || !b.assignedGuideName),
  )
  const countFor = (s: BookingStage) => filtered.filter((b) => b.stage === s).length
  const needsAction = filtered.filter((b) => nextStep(b).urgent).length
  const hasFilters = query !== '' || region !== 'All' || guide !== 'All' || stage !== 'all'

  function changeView(next: View) {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // Private mode: the choice just isn't remembered.
    }
  }

  function clearFilters() {
    setQuery('')
    setRegion('All')
    setGuide('All')
    setStage('all')
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-1">Inquiries &amp; Bookings</h2>
          <p className="font-body-md text-sm text-on-surface-variant">
            Every trip from first request to completion.{' '}
            {needsAction > 0 && (
              <span className="text-terracotta font-label-md">
                {needsAction} need{needsAction === 1 ? 's' : ''} your action.
              </span>
            )}
          </p>
        </div>
        <fieldset className="flex bg-surface-container rounded-lg p-1 w-fit">
          <legend className="sr-only">View</legend>
          {(
            [
              ['board', 'Board', Kanban],
              ['table', 'Table', Table],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => changeView(key)}
              className={`px-4 py-2 rounded-md font-label-md text-sm flex items-center gap-2 transition-colors ${
                view === key
                  ? 'bg-surface-container-lowest shadow-sm text-on-surface'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </fieldset>
      </div>

      {/* Stage summary: also a filter in the table view. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {STAGE_ORDER.map((s) => {
          const active = stage === s
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setStage(active ? 'all' : s)
                if (!active) changeView('table')
              }}
              className={`text-left rounded-xl border p-3 transition-colors ${
                active ? 'border-savanna-green bg-savanna-green/5' : 'border-sand-stone bg-surface-container-lowest hover:border-savanna-green/50'
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-label-md text-on-surface-variant">
                <span className={`w-2.5 h-2.5 rounded-full ${STAGE_DOT[s]}`} />
                {STAGE_LABELS[s]}
              </span>
              <span className="block font-headline-md text-[24px] text-on-surface mt-1 tabular-nums">{countFor(s)}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-surface-container-low p-3 rounded-xl border border-sand-stone mb-6">
        <label className="relative flex-1 min-w-[220px]">
          <span className="sr-only">Search bookings</span>
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client, email, trip or #id"
            className="w-full min-h-[40px] bg-surface-container-lowest border border-sand-stone rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-savanna-green/40"
          />
        </label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="Region"
          className="min-h-[40px] bg-surface-container-lowest border border-sand-stone text-on-surface text-sm rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-savanna-green/40"
        >
          <option value="All">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={guide}
          onChange={(e) => setGuide(e.target.value as 'All' | 'Unassigned')}
          aria-label="Guide"
          className="min-h-[40px] bg-surface-container-lowest border border-sand-stone text-on-surface text-sm rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-savanna-green/40"
        >
          <option value="All">Any guide</option>
          <option value="Unassigned">No guide yet</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-terracotta hover:bg-terracotta/10 font-label-md text-sm px-3 min-h-[40px] rounded-lg transition-colors"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {loading && <p className="text-center text-on-surface-variant py-10">Loading bookings…</p>}
      {error && <p className="text-center text-error py-10">{error}</p>}
      {!loading && !error && all.length === 0 && (
        <p className="text-center text-on-surface-variant py-16">No inquiries yet. New requests and bookings will appear here.</p>
      )}
      {!loading && !error && all.length > 0 && view === 'board' && <Board bookings={filtered} />}
      {!loading && !error && all.length > 0 && view === 'table' && (
        <BookingTable bookings={stage === 'all' ? filtered : filtered.filter((b) => b.stage === stage)} />
      )}
    </div>
  )
}

function Board({ bookings }: Readonly<{ bookings: Booking[] }>) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 items-start">
      {STAGE_ORDER.map((stage) => {
        const cards = bookings.filter((b) => b.stage === stage)
        return (
          <section
            key={stage}
            aria-label={STAGE_LABELS[stage]}
            className="min-w-[290px] w-[290px] shrink-0 bg-surface-container-low rounded-xl border border-sand-stone flex flex-col"
          >
            <header className="px-4 py-3 flex items-center gap-2 border-b border-sand-stone">
              <span className={`w-2.5 h-2.5 rounded-full ${STAGE_DOT[stage]}`} />
              <h3 className="font-label-md text-sm text-on-surface">{STAGE_LABELS[stage]}</h3>
              <span className="ml-auto bg-surface-container-lowest text-on-surface-variant text-xs px-2 py-0.5 rounded-full tabular-nums">
                {cards.length}
              </span>
            </header>
            <div className="p-3 flex flex-col gap-3">
              {cards.length === 0 && (
                <p className="text-on-surface-variant text-xs text-center border-2 border-dashed border-sand-stone rounded-lg py-8 px-4">
                  Nothing here
                </p>
              )}
              {cards.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function BookingCard({ booking: b }: Readonly<{ booking: Booking }>) {
  const step = nextStep(b)
  return (
    <Link
      to={`/admin/inquiries/${b.id}`}
      className={`block bg-surface-container-lowest border rounded-lg p-4 shadow-[0_1px_4px_rgba(45,45,45,0.05)] hover:shadow-[0_4px_12px_rgba(45,45,45,0.10)] hover:border-savanna-green/40 transition-all ${
        step.urgent ? 'border-terracotta/40' : 'border-sand-stone'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[11px] font-label-sm px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant truncate">
          {b.region}
        </span>
        <span className="text-on-surface-variant text-xs font-label-sm shrink-0">#{b.id}</span>
      </div>
      <h4 className="font-headline-md text-base text-on-surface leading-snug">{b.customerName || b.customerEmail}</h4>
      <p className="text-sm text-on-surface-variant mb-3 line-clamp-2">{b.packageTitle}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant mb-3">
        <span className="inline-flex items-center gap-1.5">
          <CalendarCheck size={14} /> {formatRange(b.startDate, b.endDate)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users size={14} /> {b.guests} guest{b.guests === 1 ? '' : 's'}
        </span>
      </div>
      {b.quoteRequested && b.stage === 'new_inquiry' && (
        <p className="inline-flex items-center gap-1 text-[11px] font-label-md text-secondary bg-golden-sun/15 rounded-md px-2 py-0.5 mb-3">
          <PaperPlaneTilt size={12} /> Trip planner request
        </p>
      )}
      <div className="flex items-center justify-between gap-2 border-t border-sand-stone pt-3">
        <div className="min-w-0">
          <p className={`text-sm font-label-md tabular-nums ${b.subtotal > 0 ? 'text-on-surface' : 'text-on-surface-variant'}`}>
            {amountLabel(b)}
          </p>
          <p className={`text-[11px] ${step.urgent ? 'text-terracotta font-label-md' : 'text-on-surface-variant'}`}>{step.label}</p>
        </div>
        <GuideAvatar name={b.assignedGuideName} />
      </div>
    </Link>
  )
}

function GuideAvatar({ name }: Readonly<{ name: string | null }>) {
  if (!name) {
    return (
      <span
        className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-xs text-on-surface-variant border border-dashed border-outline-variant shrink-0"
        title="No guide yet"
      >
        ?
      </span>
    )
  }
  return (
    <span
      className="w-7 h-7 rounded-full bg-savanna-green/15 text-savanna-green flex items-center justify-center text-[10px] font-label-md border border-savanna-green/30 shrink-0"
      title={`Guide: ${name}`}
    >
      {initials(name)}
    </span>
  )
}

function BookingTable({ bookings }: Readonly<{ bookings: Booking[] }>) {
  // Soonest trips first: what's coming up is what needs attention.
  const rows = [...bookings].sort((a, b) => a.startDate.localeCompare(b.startDate))
  if (rows.length === 0) {
    return <p className="text-center text-on-surface-variant py-16">Nothing matches these filters.</p>
  }
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-sand-stone overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-surface-container-low text-on-surface-variant text-[11px] font-label-sm uppercase tracking-wider">
          <tr>
            <th className="py-3 pl-5 pr-3 font-medium">#</th>
            <th className="py-3 pr-3 font-medium">Client</th>
            <th className="py-3 pr-3 font-medium">Trip</th>
            <th className="py-3 pr-3 font-medium">Dates</th>
            <th className="py-3 pr-3 font-medium">Stage</th>
            <th className="py-3 pr-3 font-medium">Guide</th>
            <th className="py-3 pr-3 font-medium text-right">Amount</th>
            <th className="py-3 pr-5 font-medium">Next step</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sand-stone">
          {rows.map((b) => {
            const step = nextStep(b)
            return (
              <tr key={b.id} className="hover:bg-surface-container-low/60">
                <td className="py-3 pl-5 pr-3 text-on-surface-variant">
                  <Link to={`/admin/inquiries/${b.id}`} className="hover:text-savanna-green">
                    {b.id}
                  </Link>
                </td>
                <td className="py-3 pr-3">
                  <Link to={`/admin/inquiries/${b.id}`} className="font-label-md text-on-surface hover:text-savanna-green">
                    {b.customerName || b.customerEmail}
                  </Link>
                  <p className="text-xs text-on-surface-variant">{b.customerEmail}</p>
                </td>
                <td className="py-3 pr-3 max-w-[16rem]">
                  <p className="text-on-surface truncate">{b.packageTitle}</p>
                  <p className="text-xs text-on-surface-variant">
                    {b.region} · {b.guests} guest{b.guests === 1 ? '' : 's'}
                  </p>
                </td>
                <td className="py-3 pr-3 whitespace-nowrap text-on-surface-variant">{formatRange(b.startDate, b.endDate)}</td>
                <td className="py-3 pr-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-label-md ${STAGE_BADGE[b.stage]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STAGE_DOT[b.stage]}`} />
                    {STAGE_LABELS[b.stage]}
                  </span>
                </td>
                <td className="py-3 pr-3 text-on-surface-variant">{b.assignedGuideName ?? '—'}</td>
                <td className="py-3 pr-3 text-right tabular-nums whitespace-nowrap">{amountLabel(b)}</td>
                <td className={`py-3 pr-5 whitespace-nowrap ${step.urgent ? 'text-terracotta font-label-md' : 'text-on-surface-variant'}`}>
                  {step.label}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
