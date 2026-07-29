import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** Scrolls to the URL hash target on navigation, otherwise resets scroll and moves focus to main content. */
export function ScrollManager() {
  const { pathname, hash } = useLocation()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (hash) {
      const target = document.querySelector(hash)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }

    window.scrollTo({ top: 0 })
    document.getElementById('main-content')?.focus()
  }, [pathname, hash])

  return null
}
