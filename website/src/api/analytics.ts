import { apiGet } from '../lib/api'

export interface FunnelSummary {
  visited: number
  started: number
  submitted: number
  confirmed: number
}

export function getFunnelSummary(): Promise<FunnelSummary> {
  return apiGet<FunnelSummary>('/api/analytics/funnel/')
}
