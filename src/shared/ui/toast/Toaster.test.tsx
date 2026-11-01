import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { holdAnimation } from '@/shared/test'
import { TOAST_DURATION_MS, Toaster } from './Toaster'
import { showToast } from './toastStore'

describe('Toaster', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('announces toasts in a live region', () => {
    render(<Toaster />)

    act(() => showToast('Saved'))

    expect(screen.getByRole('region', { name: 'Powiadomienia' })).toHaveTextContent('Saved')
    expect(screen.getByRole('list')).toHaveAttribute('aria-live', 'polite')
  })

  it('hides a toast after a while', () => {
    vi.useFakeTimers()
    render(<Toaster />)
    act(() => showToast('Saved'))

    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS))

    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('can be dismissed', async () => {
    render(<Toaster />)
    act(() => {
      showToast('First')
      showToast('Second', 'error')
    })

    await userEvent.click(screen.getAllByRole('button', { name: 'Zamknij powiadomienie' })[0]!)

    expect(screen.queryByText('First')).not.toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('plays the exit animation before the toast goes', async () => {
    render(<Toaster />)
    act(() => showToast('Saved'))
    const toast = screen.getByRole('listitem')
    const finishExit = holdAnimation(toast)

    await userEvent.click(screen.getByRole('button', { name: 'Zamknij powiadomienie' }))

    expect(toast).toHaveAttribute('data-closing')
    expect(screen.getByText('Saved')).toBeInTheDocument()
    await finishExit()
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })
})
