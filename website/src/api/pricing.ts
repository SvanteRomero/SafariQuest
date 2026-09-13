import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'
import { fromApiShape, toApiShape } from '../lib/caseMap'

export interface Season {
  id: number
  name: string
  startDate: string
  endDate: string
  multiplier: number
}

export interface SeasonInput {
  name: string
  startDate: string
  endDate: string
  multiplier: number
}

interface SeasonApiShape {
  id: number
  name: string
  start_date: string
  end_date: string
  multiplier: string
}

function mapSeason(raw: SeasonApiShape): Season {
  return fromApiShape<SeasonApiShape, Season>(raw, { multiplier: (r) => Number(r.multiplier) })
}

// No id (a create/update body doesn't send one — Django takes it from the
// URL on update, assigns it on create) and no overrides: unlike mapSeason
// above, multiplier needs no coercion on the way OUT — the API accepts a
// plain JSON number for this field; Number(...) is only needed on the way in
// because the API always returns it serialized as a string.
function toSeasonApiPayload(input: SeasonInput): Omit<SeasonApiShape, 'id'> {
  return toApiShape<SeasonInput, Omit<SeasonApiShape, 'id'>>(input)
}

export async function getSeasons(): Promise<Season[]> {
  const raw = await apiGet<SeasonApiShape[]>('/api/pricing/seasons/')
  return raw.map(mapSeason)
}

export async function createSeason(input: SeasonInput): Promise<Season> {
  const raw = await apiPost<SeasonApiShape>('/api/pricing/seasons/', toSeasonApiPayload(input))
  return mapSeason(raw)
}

export async function updateSeason(id: number, input: SeasonInput): Promise<Season> {
  const raw = await apiPatch<SeasonApiShape>(`/api/pricing/seasons/${id}/`, toSeasonApiPayload(input))
  return mapSeason(raw)
}

export function deleteSeason(id: number): Promise<void> {
  return apiDelete(`/api/pricing/seasons/${id}/`)
}
