import type { Season } from '../api/pricing'

export function activeSeasonForDate(seasons: Season[], dateStr: string): Season | null {
  if (!dateStr) return null
  const date = new Date(`${dateStr}T00:00:00`)
  return (
    seasons.find((s) => {
      const start = new Date(`${s.startDate}T00:00:00`)
      const end = new Date(`${s.endDate}T00:00:00`)
      return date >= start && date <= end
    }) ?? null
  )
}

export function seasonalPrice(basePrice: number, seasons: Season[], dateStr: string): number {
  const season = activeSeasonForDate(seasons, dateStr)
  return season ? Math.round(basePrice * season.multiplier) : basePrice
}
