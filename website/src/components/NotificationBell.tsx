import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellSlash, Checks } from '@phosphor-icons/react'
import { getNotifications, markNotificationsRead, type NotificationFeed, type PortalNotification } from '../api/notifications'
import { useCurrentLocale } from '../i18n/useLocale'
import { localizeHome } from '../i18n/localize'

// New notifications show up within a minute; opening the bell always fetches fresh.
const POLL_MS = 60_000

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} d ago`
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/**
 * The bell in every portal header (customer, agent, guide, admin): an unread count, and
 * a panel of the latest notifications. Clicking one marks it read and opens its page.
 */
export function NotificationBell({ className = '' }: Readonly<{ className?: string }>) {
  const navigate = useNavigate()
  const locale = useCurrentLocale()
  const [feed, setFeed] = useState<NotificationFeed | null>(null)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(() => {
    getNotifications()
      .then(setFeed)
      .catch(() => {
        // Signed out or offline: keep whatever was shown; the next poll tries again.
      })
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function toggle() {
    if (!open) refresh()
    setOpen((value) => !value)
  }

  function openNotification(notification: PortalNotification) {
    if (!notification.readAt) {
      void markNotificationsRead(notification.id).then(refresh)
    }
    setOpen(false)
    if (notification.link) void navigate(localizeHome(locale, notification.link))
  }

  function markAllRead() {
    void markNotificationsRead().then(refresh)
  }

  const unread = feed?.unread ?? 0
  const items = feed?.results ?? []

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
      >
        <Bell size={22} weight={unread ? 'fill' : 'regular'} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] max-h-[70vh] overflow-hidden flex flex-col rounded-xl border border-sand-stone bg-surface-container-lowest shadow-xl z-50"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-sand-stone">
            <p className="font-label-md text-on-surface">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-label-md text-savanna-green hover:underline"
              >
                <Checks size={14} /> Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-on-surface-variant">
              <BellSlash size={28} className="mx-auto mb-2 opacity-60" />
              Nothing yet. Updates about your bookings and payments will appear here.
            </div>
          ) : (
            <ul className="overflow-y-auto divide-y divide-sand-stone/70">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-surface-container-low transition-colors ${
                      n.readAt ? '' : 'bg-savanna-green/5'
                    }`}
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.readAt ? 'bg-transparent' : 'bg-terracotta'}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className={`block text-sm ${n.readAt ? 'text-on-surface-variant' : 'text-on-surface font-label-md'}`}>
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="block text-xs text-on-surface-variant mt-0.5 line-clamp-2">{n.body}</span>
                      )}
                      <span className="block text-[11px] text-on-surface-variant/80 mt-1">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
