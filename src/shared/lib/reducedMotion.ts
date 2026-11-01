import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

const getMediaQuery = () =>
  typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : undefined

export const prefersReducedMotion = () => getMediaQuery()?.matches ?? false

const subscribe = (onChange: () => void) => {
  const mediaQuery = getMediaQuery()
  mediaQuery?.addEventListener('change', onChange)
  return () => mediaQuery?.removeEventListener('change', onChange)
}

export const usePrefersReducedMotion = () =>
  useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
