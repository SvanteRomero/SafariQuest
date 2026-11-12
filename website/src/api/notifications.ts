import { apiGet, apiPost } from '../lib/api'

/** A message in the signed-in user's portal — how the system tells customers, agents,
 * guides and admins about bookings and payments (email is only for account access). */
export interface PortalNotification {
  id: number
  title: string
  body: string
  /** A site path without a language prefix, e.g. "/account/trips/12"; may be empty. */
  link: string
  createdAt: string
  readAt: string | null
}

interface NotificationApiShape {
  id: number
  title: string
  body: string
  link: string
  created_at: string
  read_at: string | null
}

export interface NotificationFeed {
  unread: number
  results: PortalNotification[]
}

export async function getNotifications(): Promise<NotificationFeed> {
  const raw = await apiGet<{ unread: number; results: NotificationApiShape[] }>('/api/notifications/')
  return {
    unread: raw.unread,
    results: raw.results.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      link: n.link,
      createdAt: n.created_at,
      readAt: n.read_at,
    })),
  }
}

/** Marks one notification read, or all of them when no id is given. */
export async function markNotificationsRead(id?: number): Promise<void> {
  await apiPost('/api/notifications/read/', id === undefined ? {} : { id })
}
