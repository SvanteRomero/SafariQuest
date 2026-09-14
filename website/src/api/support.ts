import { apiGet, apiGetPage, apiPatch, apiPost, type Page } from '../lib/api'
import { fromApiShape } from '../lib/caseMap'

export type TicketStatus = 'open' | 'in_progress' | 'resolved'

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

export interface SupportTicketNote {
  id: number
  author: string
  text: string
  createdAt: string
}

export interface SupportTicket {
  id: number
  reporterName: string
  reporterRole: string
  booking: number | null
  bookingTitle: string | null
  category: string
  description: string
  photo: string
  status: TicketStatus
  createdAt: string
  notes: SupportTicketNote[]
}

interface SupportTicketApiShape {
  id: number
  reporter_name: string
  reporter_role: string
  booking: number | null
  booking_title: string | null
  category: string
  description: string
  photo: string
  status: TicketStatus
  created_at: string
  notes: { id: number; author_name: string; text: string; created_at: string }[]
}

function mapTicket(raw: SupportTicketApiShape): SupportTicket {
  return fromApiShape<SupportTicketApiShape, SupportTicket>(raw, {
    // The nested shape's own case conversion is pure (author_name would
    // auto-convert to authorName) except this one field is named author, not
    // authorName, on the SupportTicketNote side — small enough to just write
    // out rather than reach for fromApiShape a second time for 4 fields.
    notes: (r) => r.notes.map((n) => ({ id: n.id, author: n.author_name, text: n.text, createdAt: n.created_at })),
  })
}

/** A reporter's view of their own ticket, from `/api/support/tickets/mine/`.
 *
 * Narrower than `SupportTicket` on purpose: the server withholds the admin
 * note thread (internal triage, not customer replies) and the reporter's own
 * name/role, so those fields genuinely are not in this payload.
 */
export interface MySupportTicket {
  id: number
  booking: number | null
  bookingTitle: string | null
  category: string
  description: string
  photo: string
  status: TicketStatus
  createdAt: string
}

interface MySupportTicketApiShape {
  id: number
  booking: number | null
  booking_title: string | null
  category: string
  description: string
  photo: string
  status: TicketStatus
  created_at: string
}

export async function getMyTickets(): Promise<MySupportTicket[]> {
  const raw = await apiGet<MySupportTicketApiShape[]>('/api/support/tickets/mine/')
  return raw.map((t) => fromApiShape<MySupportTicketApiShape, MySupportTicket>(t))
}

export interface CreateTicketInput {
  booking?: number
  category?: string
  description: string
  photo?: string
}

export async function createTicket(input: CreateTicketInput): Promise<SupportTicket> {
  const raw = await apiPost<SupportTicketApiShape>('/api/support/tickets/', input)
  return mapTicket(raw)
}

export async function getTicketsPage(page: number): Promise<Page<SupportTicket>> {
  const raw = await apiGetPage<SupportTicketApiShape>(`/api/support/tickets/?page=${page}`)
  return { ...raw, results: raw.results.map(mapTicket) }
}

export async function getTicket(id: number): Promise<SupportTicket> {
  const raw = await apiGet<SupportTicketApiShape>(`/api/support/tickets/${id}/`)
  return mapTicket(raw)
}

export async function updateTicketStatus(id: number, status: TicketStatus): Promise<SupportTicket> {
  const raw = await apiPatch<SupportTicketApiShape>(`/api/support/tickets/${id}/`, { status })
  return mapTicket(raw)
}

export async function addTicketNote(id: number, text: string): Promise<SupportTicket> {
  const raw = await apiPost<SupportTicketApiShape>(`/api/support/tickets/${id}/notes/`, { text })
  return mapTicket(raw)
}
