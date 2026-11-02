import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSearchInput } from './useSearchInput'

const setup = (initialUrlValue?: string) => {
  const onChange = vi.fn()
  const hook = renderHook(({ urlValue }) => useSearchInput(urlValue, onChange), {
    initialProps: { urlValue: initialUrlValue },
  })
  const value = () => hook.result.current[0]
  const type = (next: string) => act(() => hook.result.current[1](next))
  const setUrl = (urlValue: string | undefined) => hook.rerender({ urlValue })
  return { onChange, value, type, setUrl }
}

describe('useSearchInput', () => {
  it('starts from the URL value', () => {
    expect(setup('van').value()).toBe('van')
    expect(setup().value()).toBe('')
  })

  it('sends each change, with an empty input as no value', () => {
    const { onChange, type } = setup('a')

    type('ab')
    type('')

    expect(onChange.mock.calls).toEqual([['ab'], [undefined]])
  })

  it('keeps typing ahead of URL updates that arrive late', () => {
    const { value, type, setUrl } = setup()

    type('s')
    type('sp')
    type('spr')
    setUrl('s')
    setUrl('sp')

    expect(value()).toBe('spr')
    setUrl('spr')
    expect(value()).toBe('spr')
  })

  it('takes a URL value it did not send, e.g. from a link', () => {
    const { value, type, setUrl } = setup()
    type('sprinter')
    setUrl('sprinter')

    setUrl(undefined)

    expect(value()).toBe('')
  })
})
