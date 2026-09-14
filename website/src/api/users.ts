import { apiGet, apiPatch, apiPost } from '../lib/api'
import { fromApiShape } from '../lib/caseMap'

export interface AdminUserRecord {
  id: number
  name: string
  email: string
  role: 'admin'
  isActive: boolean
}

export interface InviteUserInput {
  name: string
  email: string
}

interface AdminUserApiShape {
  id: number
  name: string
  email: string
  role: 'admin'
  is_active: boolean
}

function mapUser(raw: AdminUserApiShape): AdminUserRecord {
  return fromApiShape<AdminUserApiShape, AdminUserRecord>(raw)
}

export async function getUsers(): Promise<AdminUserRecord[]> {
  const raw = await apiGet<AdminUserApiShape[]>('/api/users/')
  return raw.map(mapUser)
}

export async function inviteUser(input: InviteUserInput): Promise<AdminUserRecord> {
  const raw = await apiPost<AdminUserApiShape>('/api/users/', input)
  return mapUser(raw)
}

export async function setUserActive(id: number, isActive: boolean): Promise<AdminUserRecord> {
  const raw = await apiPatch<AdminUserApiShape>(`/api/users/${id}/`, { is_active: isActive })
  return mapUser(raw)
}
