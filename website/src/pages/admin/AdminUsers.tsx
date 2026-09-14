import { useState, type FormEvent } from 'react'
import { ClockCounterClockwise, Plus, X } from '@phosphor-icons/react'
import { getUsers, inviteUser, setUserActive, type AdminUserRecord } from '../../api/users'
import { getAuditLogPage } from '../../api/auditLog'
import { useAuth } from '../../auth/AuthContext'
import { useFetch } from '../../lib/useFetch'
import { usePaginatedFetch } from '../../lib/usePaginatedFetch'
import { ApiError, STANDARD_PAGE_SIZE } from '../../lib/api'
import { Pager } from '../../components/admin/Pager'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AdminUsers() {
  const { user: currentUser } = useAuth()
  const { data: users, loading, error, refetch } = useFetch(getUsers, [])
  const {
    data: auditLog,
    loading: auditLoading,
    error: auditError,
    page: auditPage,
    count: auditCount,
    hasNext: auditHasNext,
    hasPrevious: auditHasPrevious,
    nextPage: auditNextPage,
    prevPage: auditPrevPage,
  } = usePaginatedFetch(getAuditLogPage, [])
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  async function handleToggleActive(u: AdminUserRecord) {
    setToggleError(null)
    setTogglingId(u.id)
    try {
      await setUserActive(u.id, !u.isActive)
      refetch()
    } catch (err) {
      setToggleError(err instanceof ApiError ? err.message : 'Failed to update account status.')
    } finally {
      setTogglingId(null)
    }
  }

  function openCreate() {
    setName('')
    setEmail('')
    setFormError(null)
    setCreating(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      await inviteUser({ name, email })
      setCreating(false)
      refetch()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to invite user.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-headline-lg text-[26px] text-on-surface mb-1">Administrators</h2>
          <p className="text-on-surface-variant text-sm">Manage admin accounts.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="min-h-[40px] flex items-center gap-2 bg-savanna-green text-on-primary px-5 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus size={16} />
          Invite Administrator
        </button>
      </div>

      {toggleError && (
        <div className="mb-4 bg-error-container text-error rounded-lg px-4 py-3 text-sm">{toggleError}</div>
      )}

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
        {loading && <p className="p-10 text-center text-on-surface-variant text-sm">Loading users…</p>}
        {error && <p className="p-10 text-center text-error text-sm">{error}</p>}
        {!loading && !error && users && users.length === 0 && (
          <p className="p-10 text-center text-on-surface-variant text-sm">No admin accounts yet.</p>
        )}
        {!loading && !error && users && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-stone">
                {users.map((u: AdminUserRecord) => {
                  const isSelf = currentUser?.email === u.email
                  return (
                    <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-terracotta/15 text-terracotta">
                            {initials(u.name || u.email)}
                          </div>
                          <span className="font-label-md text-sm text-on-surface">{u.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant text-sm">{u.email}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
                            u.isActive
                              ? 'bg-savanna-green/15 text-savanna-green'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-savanna-green' : 'bg-outline'}`} />
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          disabled={togglingId === u.id || isSelf}
                          title={isSelf ? "You can't deactivate your own account" : undefined}
                          onClick={() => handleToggleActive(u)}
                          className="text-xs font-label-md px-3 py-1.5 rounded-lg border border-sand-stone text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
                        >
                          {togglingId === u.id ? 'Saving…' : u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-10">
        <h3 className="font-headline-md text-[20px] text-on-surface mb-1 flex items-center gap-2">
          <ClockCounterClockwise size={20} className="text-savanna-green" />
          Activity Log
        </h3>
        <p className="text-on-surface-variant text-sm mb-4">
          The most recent state-changing actions across the platform. Not every action is logged yet.
        </p>
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
          {auditLoading && <p className="p-10 text-center text-on-surface-variant text-sm">Loading activity…</p>}
          {auditError && <p className="p-10 text-center text-error text-sm">{auditError}</p>}
          {!auditLoading && !auditError && auditLog.length === 0 && (
            <p className="p-10 text-center text-on-surface-variant text-sm">No activity recorded yet.</p>
          )}
          {!auditLoading && !auditError && auditLog.length > 0 && (
            <div className="divide-y divide-sand-stone max-h-96 overflow-y-auto">
              {auditLog.map((entry) => (
                <div key={entry.id} className="px-5 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-label-md text-sm text-on-surface">{entry.description}</p>
                    <p className="text-xs text-on-surface-variant">
                      {entry.actorName} · {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-label-sm bg-surface-container text-on-surface-variant">
                    {entry.action}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {!auditLoading && !auditError && auditLog.length > 0 && (
          <Pager
            page={auditPage}
            count={auditCount}
            pageSize={STANDARD_PAGE_SIZE}
            hasNext={auditHasNext}
            hasPrevious={auditHasPrevious}
            onNext={auditNextPage}
            onPrevious={auditPrevPage}
          />
        )}
      </div>

      {creating && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-deep-earth/30 backdrop-blur-sm"
          onClick={() => setCreating(false)}
          onKeyDown={(e) => e.key === 'Escape' && setCreating(false)}
        >
          <div className="w-full max-w-md h-full bg-surface-container-lowest shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-sand-stone bg-surface-container-low/40 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-[18px] text-on-surface">Invite Administrator</h3>
                <button type="button" onClick={() => setCreating(false)} className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="mt-1 text-on-surface-variant text-sm">
                Guides are created from Staff &amp; Guides, not here — this invites another admin account.
              </p>
            </div>

            <form id="invite-user-form" className="flex-1 overflow-y-auto p-6 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="new-user-name" className="block font-label-md text-sm text-on-surface mb-1.5">Full Name</label>
                <input
                  id="new-user-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green focus:border-savanna-green transition-colors"
                />
              </div>
              <div>
                <label htmlFor="new-user-email" className="block font-label-md text-sm text-on-surface mb-1.5">Email Address</label>
                <input
                  id="new-user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pandewildernesssafari.com"
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green focus:border-savanna-green transition-colors"
                />
              </div>
              {formError && <p role="alert" className="text-error font-label-sm text-sm">{formError}</p>}
            </form>

            <div className="border-t border-sand-stone px-6 py-4 bg-surface-container-low/40 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setCreating(false)} className="rounded-lg px-4 py-2 font-label-md text-sm text-on-surface-variant hover:bg-surface-container transition-colors border border-sand-stone">
                Cancel
              </button>
              <button type="submit" form="invite-user-form" disabled={submitting} className="rounded-lg bg-savanna-green px-6 py-2 font-label-md text-sm text-on-primary hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60">
                {submitting ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
