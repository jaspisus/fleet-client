import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDocumentTitle } from './useDocumentTitle'

describe('useDocumentTitle', () => {
  it('sets the page title and restores the previous one on unmount', () => {
    document.title = 'Before'
    const { rerender, unmount } = renderHook(({ page }) => useDocumentTitle('Fleet', page), {
      initialProps: { page: 'Vehicles' as string | undefined },
    })
    expect(document.title).toBe('Vehicles · Fleet')

    rerender({ page: undefined })
    expect(document.title).toBe('Fleet')

    unmount()
    expect(document.title).toBe('Before')
  })
})
