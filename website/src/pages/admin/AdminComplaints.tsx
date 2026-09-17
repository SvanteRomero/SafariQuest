import { useState, type FormEvent } from 'react'
import { Warning, Clock, CheckCircle, PaperPlaneRight } from '@phosphor-icons/react'
import {
  getTicketsPage,
  updateTicketStatus,
  addTicketNote,
  TICKET_STATUS_LABELS,
  type SupportTicket,
  type TicketStatus,
} from '../../api/support'
import { usePaginatedFetch } from '../../lib/usePaginatedFetch'
import { ApiError, STANDARD_PAGE_SIZE } from '../../lib/api'
import { Pager } from '../../components/admin/Pager'

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: 'bg-error-container text-error',
  in_progress: 'bg-golden-sun/20 text-secondary',
  resolved: 'bg-savanna-green/15 text-savanna-green',
}

export function AdminComplaints() {
  const {
    data: allTickets,
    loading,
    error,
    page,
    count,
    hasNext,
    hasPrevious,
    nextPage,
    prevPage,
    refetch,
  } = usePaginatedFetch(getTicketsPage, [])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const selected: SupportTicket | undefined = allTickets.find((t) => t.id === selectedId) ?? allTickets[0]

  async function handleStatusChange(status: TicketStatus) {
    if (!selected) return
    setActionError(null)
    setUpdatingStatus(true)
    try {
      await updateTicketStatus(selected.id, status)
      refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleAddNote(event: FormEvent) {
    event.preventDefault()
    if (!selected || !noteDraft.trim()) return
    setActionError(null)
    setSavingNote(true)
    try {
      await addTicketNote(selected.id, noteDraft.trim())
      setNoteDraft('')
      refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to add note.')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-headline-lg text-[28px] text-on-surface mb-1">Complaints</h2>
        <p className="text-on-surface-variant text-sm">Guest- and guide-reported issues, across active and past trips.</p>
      </div>

      {loading && <p className="text-center text-on-surface-variant py-10">Loading…</p>}
      {error && <p className="text-center text-error py-10">{error}</p>}

      {!loading && !error && allTickets.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <Warning size={26} className="text-on-surface-variant" />
          </div>
          <h3 className="font-headline-md text-[18px] text-on-surface mb-2">No complaints filed</h3>
          <p className="text-on-surface-variant text-sm max-w-md">
            Guide and guest-reported issues will appear here once someone files one.
          </p>
        </div>
      )}

      {!loading && !error && allTickets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden divide-y divide-sand-stone">
            {allTickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-4 hover:bg-surface-container-low transition-colors ${
                  selected?.id === t.id ? 'bg-surface-container-low' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-md text-sm text-on-surface">{t.reporterName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-label-sm ${STATUS_STYLES[t.status]}`}>
                    {TICKET_STATUS_LABELS[t.status]}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant capitalize">
                  {t.reporterRole} {t.category && `· ${t.category}`}
                </p>
                <p className="text-sm text-on-surface-variant line-clamp-1 mt-1">{t.description}</p>
              </button>
            ))}
          </div>

          {selected && (
            <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-headline-md text-[18px] text-on-surface">{selected.reporterName}</h3>
                  <p className="text-on-surface-variant text-sm capitalize">
                    {selected.reporterRole} {selected.category && `· ${selected.category}`}
                    {selected.bookingTitle && ` · ${selected.bookingTitle}`}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-label-sm ${STATUS_STYLES[selected.status]}`}>
                  {TICKET_STATUS_LABELS[selected.status]}
                </span>
              </div>

              <p className="font-body-md text-on-surface mb-4">{selected.description}</p>
              {selected.photo && (
                <img src={selected.photo} alt="Attached" className="rounded-lg max-h-48 mb-4 object-cover" />
              )}

              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <button
                  type="button"
                  disabled={updatingStatus || selected.status === 'in_progress'}
                  onClick={() => handleStatusChange('in_progress')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-sand-stone text-sm text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  <Clock size={16} />
                  Mark In Progress
                </button>
                <button
                  type="button"
                  disabled={updatingStatus || selected.status === 'resolved'}
                  onClick={() => handleStatusChange('resolved')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-savanna-green text-on-primary text-sm hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
                >
                  <CheckCircle size={16} />
                  Mark Resolved
                </button>
              </div>

              <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Notes</h4>
              <div className="space-y-3 mb-4">
                {selected.notes.length === 0 && <p className="text-on-surface-variant text-sm">No notes yet.</p>}
                {selected.notes.map((n) => (
                  <div key={n.id} className="bg-surface-container-low rounded-lg p-3">
                    <p className="text-sm text-on-surface">{n.text}</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {n.author} · {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {actionError && <p className="text-error text-sm mb-2">{actionError}</p>}

              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Add an internal note..."
                  className="flex-1 bg-surface border border-sand-stone rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
                <button
                  type="submit"
                  disabled={savingNote || !noteDraft.trim()}
                  className="p-2.5 rounded-lg bg-savanna-green text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <PaperPlaneRight size={18} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {!loading && !error && allTickets.length > 0 && (
        <Pager
          page={page}
          count={count}
          pageSize={STANDARD_PAGE_SIZE}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onNext={nextPage}
          onPrevious={prevPage}
        />
      )}
    </div>
  )
}
