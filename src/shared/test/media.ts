import { vi } from 'vitest'

/**
 * Stubs `matchMedia` so `(prefers-reduced-motion: reduce)` matches (jsdom has no `matchMedia`).
 * Restored after each test by `unstubGlobals`.
 */
export const stubReducedMotion = () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    matches: query === '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}
