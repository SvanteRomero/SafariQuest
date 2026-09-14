import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'
import { fromApiShape, toApiShape } from '../lib/caseMap'

export interface Park {
  id: string
  region: string
  name: string
  images: string[]
  imageAlt: string
  badge: string
  tags: string[]
  bestTimeToVisit: string
  highlight: string
  about: string
  wildlife: string
  gettingThere: string
}

interface ParkApiShape {
  slug: string
  region: string
  name: string
  images: string[]
  image_alt: string
  badge: string
  tags: string[]
  best_time_to_visit: string
  highlight: string
  about: string
  wildlife: string
  getting_there: string
}

function mapPark(raw: ParkApiShape): Park {
  return fromApiShape<ParkApiShape, Park>(raw, { id: (r) => r.slug }, ['slug'])
}

export async function getParks(): Promise<Park[]> {
  const raw = await apiGet<ParkApiShape[]>('/api/parks/')
  return raw.map(mapPark)
}

export async function getPark(id: string): Promise<Park> {
  const raw = await apiGet<ParkApiShape>(`/api/parks/${id}/`)
  return mapPark(raw)
}

export interface ParkInput {
  slug: string
  region: string
  name: string
  images: string[]
  imageAlt: string
  badge: string
  tags: string[]
  bestTimeToVisit: string
  highlight: string
  about: string
  wildlife: string
  gettingThere: string
}

function toParkApiShape(input: ParkInput): ParkApiShape {
  return toApiShape<ParkInput, ParkApiShape>(input)
}

export async function createPark(input: ParkInput): Promise<Park> {
  const raw = await apiPost<ParkApiShape>('/api/parks/', toParkApiShape(input))
  return mapPark(raw)
}

export async function updatePark(slug: string, input: ParkInput): Promise<Park> {
  const raw = await apiPatch<ParkApiShape>(`/api/parks/${slug}/`, toParkApiShape(input))
  return mapPark(raw)
}

export async function deletePark(slug: string): Promise<void> {
  await apiDelete(`/api/parks/${slug}/`)
}
