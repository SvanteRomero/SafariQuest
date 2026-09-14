import { CaretLeft, CaretRight } from '@phosphor-icons/react'

interface PagerProps {
  page: number
  count: number
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
  onNext: () => void
  onPrevious: () => void
}

/** Prev/Next pager for a StandardPagination-backed list. Deliberately not a
 * numbered page-range control — with page_size=25 and these tables' realistic
 * row counts, "page 3 of 40" adds complexity a Prev/Next pair doesn't need. */
export function Pager({ page, count, pageSize, hasNext, hasPrevious, onNext, onPrevious }: PagerProps) {
  if (count <= pageSize && page === 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, count)

  return (
    <div className="flex items-center justify-between gap-4 px-1 py-4 text-sm text-on-surface-variant">
      <span>
        {start}–{end} of {count}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1 px-3 border border-sand-stone rounded-lg hover:bg-surface-container disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Previous page"
        >
          <CaretLeft size={16} />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1 px-3 border border-sand-stone rounded-lg hover:bg-surface-container disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Next page"
        >
          <CaretRight size={16} />
        </button>
      </div>
    </div>
  )
}
