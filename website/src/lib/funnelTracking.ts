import { apiPost } from './api'

const STORAGE_KEY = 'sq_funnel_session_id'

function getSessionId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const generated = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, generated)
    return generated
  } catch {
    return 'no-storage'
  }
}

export type FunnelStep = 'visited' | 'started' | 'submitted'

export function trackFunnelEvent(step: FunnelStep): void {
  apiPost('/api/analytics/events/', { step, session_id: getSessionId() }).catch(() => {
    // Best-effort only — a dropped analytics event should never disrupt the Trip Curator flow.
  })
}
