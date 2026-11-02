import { useRef } from 'react'
import { afterOwnAnimations } from './afterOwnAnimations'

/**
 * Plays an element's exit animation before it is removed. `requestExit` sets `data-closing` on the
 * element behind `ref`, waits for its own animations, then calls `onExited` once.
 */
export const useExitAnimation = <T extends HTMLElement>(onExited: () => void) => {
  const ref = useRef<T>(null)
  const isExitingRef = useRef(false)

  const requestExit = () => {
    const element = ref.current
    if (!element || isExitingRef.current) return
    isExitingRef.current = true
    element.dataset.closing = ''
    afterOwnAnimations(element, onExited)
  }

  return { ref, requestExit }
}
