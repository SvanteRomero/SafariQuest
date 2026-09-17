import { useEffect } from 'react'

/** Locks page scroll while `locked` is true — for a full-screen mobile nav
 * overlay (AdminLayout, AccountLayout), where the drawer sits on top of the
 * page rather than pushing it down, so without this the page underneath
 * keeps scrolling with it. Restores the previous overflow value on unmount /
 * unlock, not just `''`, in case something else on the page already set one. */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [locked])
}
