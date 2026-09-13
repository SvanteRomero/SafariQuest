import { Plus, X } from '@phosphor-icons/react'
import type { ItineraryDay } from '../../api/safaris'

/** Day-by-day itinerary editor shared by the Safari Package and Region Safari admin forms. */
export function ItineraryEditor({
  itinerary,
  onChange,
}: {
  itinerary: ItineraryDay[]
  onChange: (updater: (list: ItineraryDay[]) => ItineraryDay[]) => void
}) {
  function addDay() {
    onChange((list) => [...list, { day: list.length + 1, title: '', description: '' }])
  }

  function updateDay(index: number, field: 'title' | 'description', value: string) {
    onChange((list) => list.map((d, i) => (i === index ? { ...d, [field]: value } : d)))
  }

  function removeDay(index: number) {
    onChange((list) => list.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 })))
  }

  return (
    <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-4">
      <h3 className="font-headline-md text-[18px] text-on-surface">Day-by-Day Itinerary</h3>
      <div className="space-y-3">
        {itinerary.map((day, index) => (
          <div key={index} className="p-4 rounded-xl bg-surface-container-low space-y-3">
            <div className="flex items-start justify-between gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-savanna-green text-on-primary font-label-md text-xs font-bold shrink-0">
                DAY {day.day}
              </span>
              <input
                value={day.title}
                onChange={(e) => updateDay(index, 'title', e.target.value)}
                placeholder="Day title, e.g. Arrival & transfer to camp"
                className="flex-1 bg-transparent border-b border-sand-stone px-1 py-1 text-sm font-label-md text-on-surface focus:outline-none focus:border-savanna-green"
              />
              <button type="button" onClick={() => removeDay(index)} className="text-on-surface-variant hover:text-error p-1">
                <X size={16} />
              </button>
            </div>
            <textarea
              value={day.description}
              onChange={(e) => updateDay(index, 'description', e.target.value)}
              rows={2}
              placeholder="Describe the day's activities..."
              className="w-full bg-surface-container-lowest border border-sand-stone rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addDay}
        className="w-full py-3 rounded-xl border-2 border-dashed border-sand-stone hover:border-savanna-green transition-colors flex items-center justify-center gap-2 text-on-surface-variant hover:text-savanna-green font-label-md text-sm"
      >
        <Plus size={18} />
        Append Day {itinerary.length + 1} to Itinerary
      </button>
    </section>
  )
}
