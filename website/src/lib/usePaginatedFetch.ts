import { useCallback, useEffect, useState } from 'react'
import { ApiError, type Page } from './api'

interface UsePaginatedFetchResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  page: number
  count: number
  hasNext: boolean
  hasPrevious: boolean
  nextPage: () => void
  prevPage: () => void
  refetch: () => void
}

/** Like useFetch, but for a StandardPagination-backed endpoint. `deps` are
 * typically filters — changing one resets to page 1, since staying on e.g.
 * page 4 of a now-different result set would 404 or show a stale page. */
export function usePaginatedFetch<T>(
  fetcher: (page: number) => Promise<Page<T>>,
  deps: unknown[],
): UsePaginatedFetchResult<T> {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<T[]>([])
  const [count, setCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  // Reset to page 1 when a filter changes. Done during render (comparing
  // against state, not a ref — this compiler forbids reading a ref during
  // render), not in an effect: an effect-based reset would let the fetch
  // effect below fire once for the old page against the new filters, then
  // again once the reset commits — a wasted request on every filter change
  // made while not already on page 1. This is the pattern React's own docs
  // recommend for "adjusting state when a prop changes".
  const [prevDeps, setPrevDeps] = useState(deps)
  const depsChanged = deps.length !== prevDeps.length || deps.some((d, i) => d !== prevDeps[i])
  if (depsChanged) {
    setPrevDeps(deps)
    if (page !== 1) setPage(1)
  }

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  const nextPage = useCallback(() => setPage((p) => p + 1), [])
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    fetcher(page)
      .then((result) => {
        if (cancelled) return
        setData(result.results)
        setCount(result.count)
        setHasNext(result.hasNext)
        setHasPrevious(result.hasPrevious)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, page, tick])

  return { data, loading, error, page, count, hasNext, hasPrevious, nextPage, prevPage, refetch }
}
