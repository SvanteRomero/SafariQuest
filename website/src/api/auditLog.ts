import { apiGetPage, type Page } from '../lib/api'
import { fromApiShape } from '../lib/caseMap'

export interface AuditLogEntry {
  id: number
  actorName: string
  action: string
  description: string
  createdAt: string
}

interface AuditLogEntryApiShape {
  id: number
  actor_name: string
  action: string
  description: string
  created_at: string
}

function mapEntry(raw: AuditLogEntryApiShape): AuditLogEntry {
  return fromApiShape<AuditLogEntryApiShape, AuditLogEntry>(raw)
}

export async function getAuditLogPage(page: number): Promise<Page<AuditLogEntry>> {
  const raw = await apiGetPage<AuditLogEntryApiShape>(`/api/audit-log/?page=${page}`)
  return { ...raw, results: raw.results.map(mapEntry) }
}
