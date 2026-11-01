import { act } from '@testing-library/react'

/**
 * jsdom runs no CSS animations, so `afterOwnAnimations` calls back at once. This gives `element`
 * one running animation instead; the returned `finish()` ends it and flushes what follows.
 */
export const holdAnimation = (element: Element) => {
  let resolve!: () => void
  const finished = new Promise<void>((done) => {
    resolve = done
  })
  element.getAnimations = () => [{ finished } as unknown as Animation]

  return async () => {
    element.getAnimations = () => []
    await act(async () => {
      resolve()
      await new Promise((done) => setTimeout(done))
    })
  }
}
