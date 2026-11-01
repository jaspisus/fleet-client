/**
 * Runs `callback` once the element's own animations finish, e.g. an exit animation started by a
 * `data-closing` attribute. Animations of its subtree (an infinite spinner) are not awaited.
 * Without animations (jsdom, or none running) `callback` runs synchronously.
 */
export const afterOwnAnimations = (element: Element, callback: () => void) => {
  const animations = element.getAnimations?.() ?? []
  if (animations.length === 0) {
    callback()
    return
  }
  void Promise.allSettled(animations.map((animation) => animation.finished)).then(callback)
}
