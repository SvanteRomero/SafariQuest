import { forwardRef } from 'react'
import { Link as RRLink, NavLink as RRNavLink } from 'react-router-dom'
import type { LinkProps, NavLinkProps } from 'react-router-dom'
import { useCurrentLocale } from './useLocale'
import { localize } from './localize'

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...props }, ref) {
  const locale = useCurrentLocale()
  return <RRLink ref={ref} to={localize(locale, to)} {...props} />
})

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink({ to, ...props }, ref) {
  const locale = useCurrentLocale()
  return <RRNavLink ref={ref} to={localize(locale, to)} {...props} />
})
