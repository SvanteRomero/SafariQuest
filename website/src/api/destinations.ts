import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'
import { fromApiShape, toApiShape } from '../lib/caseMap'

export interface DestinationExperience {
  name: string
  description: string
}

export interface Destination {
  id: string
  name: string
  images: string[]
  imageAlt: string
  badge: string
  tags: string[]
  bestTimeToVisit: string
  highlight: string
  linkLabel: string
  about: string
  wildlife: string
  gettingThere: string
  experiences: DestinationExperience[]
}

interface DestinationApiShape {
  slug: string
  name: string
  images: string[]
  image_alt: string
  badge: string
  tags: string[]
  best_time_to_visit: string
  highlight: string
  link_label: string
  about: string
  wildlife: string
  getting_there: string
  experiences: DestinationExperience[]
}

function mapDestination(raw: DestinationApiShape): Destination {
  // id is the API's slug under a different name (not just a different case),
  // so it needs an override — and slug has to be dropped or its own
  // auto-converted form would also appear in the result alongside id.
  return fromApiShape<DestinationApiShape, Destination>(raw, { id: (r) => r.slug }, ['slug'])
}

export async function getDestinations(): Promise<Destination[]> {
  const raw = await apiGet<DestinationApiShape[]>('/api/destinations/')
  return raw.map(mapDestination)
}

export async function getDestination(id: string): Promise<Destination> {
  const raw = await apiGet<DestinationApiShape>(`/api/destinations/${id}/`)
  return mapDestination(raw)
}

export interface DestinationInput {
  slug: string
  name: string
  images: string[]
  imageAlt: string
  badge: string
  tags: string[]
  bestTimeToVisit: string
  highlight: string
  linkLabel: string
  about: string
  wildlife: string
  gettingThere: string
  experiences: DestinationExperience[]
}

function toDestinationApiShape(input: DestinationInput): DestinationApiShape {
  // Pure case conversion this direction — DestinationInput already has slug
  // (not id) since the write payload is keyed the same way the API is.
  return toApiShape<DestinationInput, DestinationApiShape>(input)
}

export async function createDestination(input: DestinationInput): Promise<Destination> {
  const raw = await apiPost<DestinationApiShape>('/api/destinations/', toDestinationApiShape(input))
  return mapDestination(raw)
}

export async function updateDestination(slug: string, input: DestinationInput): Promise<Destination> {
  const raw = await apiPatch<DestinationApiShape>(`/api/destinations/${slug}/`, toDestinationApiShape(input))
  return mapDestination(raw)
}

export async function deleteDestination(slug: string): Promise<void> {
  await apiDelete(`/api/destinations/${slug}/`)
}
