import { apiGet, apiPatch, apiPost } from '../lib/api'
import { fromApiShape } from '../lib/caseMap'

export type GuideRole = 'Senior Guide' | 'Expert Guide' | 'Driver-Guide' | 'Camp Chef' | 'Tour Helper'
export type GuideStatus = 'Available' | 'On Trip' | 'Off-Duty'

export interface GuideCertification {
  id: number
  title: string
  validUntil: string | null
  document: string
}

export interface Guide {
  id: number
  name: string
  role: GuideRole
  status: GuideStatus
  rating: number
  bio: string
  languages: string[]
  specialties: string[]
  certifications: GuideCertification[]
}

export interface GuideInput {
  name: string
  role: GuideRole
  status: GuideStatus
}

interface GuideCertificationApiShape {
  id: number
  title: string
  valid_until: string | null
  document: string
}

interface GuideApiShape {
  id: number
  name: string
  role: GuideRole
  status: GuideStatus
  rating: string
  bio: string
  languages: string[]
  specialties: string[]
  certifications: GuideCertificationApiShape[]
}

function mapGuideCertification(raw: GuideCertificationApiShape): GuideCertification {
  return fromApiShape<GuideCertificationApiShape, GuideCertification>(raw)
}

function mapGuide(raw: GuideApiShape): Guide {
  return fromApiShape<GuideApiShape, Guide>(raw, {
    rating: (r) => Number(r.rating),
    certifications: (r) => r.certifications.map(mapGuideCertification),
  })
}

export async function getGuides(): Promise<Guide[]> {
  const raw = await apiGet<GuideApiShape[]>('/api/guides/')
  return raw.map(mapGuide)
}

export async function getGuide(id: number | string): Promise<Guide> {
  const raw = await apiGet<GuideApiShape>(`/api/guides/${id}/`)
  return mapGuide(raw)
}

export async function getMyGuideProfile(): Promise<Guide | null> {
  try {
    const raw = await apiGet<GuideApiShape>('/api/guides/me/')
    return mapGuide(raw)
  } catch {
    return null
  }
}

export interface GuideSelfUpdateInput {
  name?: string
  status?: GuideStatus
  bio?: string
  languages?: string[]
  specialties?: string[]
}

export async function updateMyGuideProfile(input: GuideSelfUpdateInput): Promise<Guide> {
  const raw = await apiPatch<GuideApiShape>('/api/guides/me/', input)
  return mapGuide(raw)
}

export interface GuideCertificationInput {
  title: string
  validUntil?: string
  document?: string
}

export async function addMyCertification(input: GuideCertificationInput): Promise<Guide> {
  const raw = await apiPost<GuideApiShape>('/api/guides/me/certifications/', {
    title: input.title,
    valid_until: input.validUntil || undefined,
    document: input.document || undefined,
  })
  return mapGuide(raw)
}

export interface GuideReviewSummary {
  average: number
  count: number
  distribution: { stars: number; count: number }[]
  reviews: { guestName: string; guideRating: number; tripRating: number; testimonial: string; createdAt: string }[]
}

interface GuideReviewSummaryApiShape {
  average: number
  count: number
  distribution: { stars: number; count: number }[]
  reviews: {
    guest_name: string
    guide_rating: number
    trip_rating: number
    testimonial: string
    created_at: string
  }[]
}

export async function getMyGuideReviews(): Promise<GuideReviewSummary> {
  const raw = await apiGet<GuideReviewSummaryApiShape>('/api/guides/me/reviews/')
  return fromApiShape<GuideReviewSummaryApiShape, GuideReviewSummary>(raw, {
    reviews: (r) =>
      r.reviews.map((review) => ({
        guestName: review.guest_name,
        guideRating: review.guide_rating,
        tripRating: review.trip_rating,
        testimonial: review.testimonial,
        createdAt: review.created_at,
      })),
  })
}

export async function createGuide(input: GuideInput): Promise<Guide> {
  const raw = await apiPost<GuideApiShape>('/api/guides/', input)
  return mapGuide(raw)
}

export interface GuideCreateInput {
  name: string
  email: string
  role: GuideRole
}

export interface GuideWithCredentials extends Guide {
  email: string
  temporaryPassword: string
}

interface GuideCreatedApiShape extends GuideApiShape {
  email: string
  temporary_password: string
}

export async function createGuideWithAccount(input: GuideCreateInput): Promise<GuideWithCredentials> {
  const raw = await apiPost<GuideCreatedApiShape>('/api/guides/create-with-account/', input)
  return { ...mapGuide(raw), email: raw.email, temporaryPassword: raw.temporary_password }
}
