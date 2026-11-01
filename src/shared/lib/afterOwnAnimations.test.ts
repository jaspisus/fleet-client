import { describe, expect, it, vi } from 'vitest'
import { afterOwnAnimations } from './afterOwnAnimations'

const animation = (finished: Promise<void>) => ({ finished }) as unknown as Animation

describe('afterOwnAnimations', () => {
  it('calls back at once when nothing animates', () => {
    const callback = vi.fn()

    afterOwnAnimations(document.createElement('div'), callback)

    expect(callback).toHaveBeenCalledOnce()
  })

  it('waits for every own animation, including a cancelled one', async () => {
    const element = document.createElement('div')
    let finishFade!: () => void
    let cancelSlide!: (reason: unknown) => void
    const fade = new Promise<void>((resolve) => {
      finishFade = resolve
    })
    const slide = new Promise<void>((_, reject) => {
      cancelSlide = reject
    })
    const getAnimations = vi.fn(() => [animation(fade), animation(slide)])
    element.getAnimations = getAnimations
    const callback = vi.fn()

    afterOwnAnimations(element, callback)
    finishFade()
    await fade
    expect(callback).not.toHaveBeenCalled()

    cancelSlide(new DOMException('Animation cancelled', 'AbortError'))
    await vi.waitFor(() => expect(callback).toHaveBeenCalledOnce())
    // Without `{ subtree: true }`: an infinite spinner inside must not block the callback.
    expect(getAnimations).toHaveBeenCalledWith()
  })
})
