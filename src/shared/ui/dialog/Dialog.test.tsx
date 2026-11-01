import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { holdAnimation } from '@/shared/test'
import { Dialog } from './Dialog'
import { useCloseDialog } from './DialogContext'

const pressEscape = (dialog: HTMLElement) =>
  fireEvent(dialog, new Event('cancel', { cancelable: true }))

const CloseFromContent = () => {
  const closeDialog = useCloseDialog()
  return (
    <button type="button" onClick={closeDialog}>
      Gotowe
    </button>
  )
}

describe('Dialog', () => {
  it('opens as a labelled modal while mounted', () => {
    render(
      <Dialog title="Edit vehicle" onClose={vi.fn()}>
        Content
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Edit vehicle' })
    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveTextContent('Content')
  })

  it('asks the parent to close on Esc', () => {
    const onClose = vi.fn()
    render(
      <Dialog title="Edit" onClose={onClose}>
        Content
      </Dialog>,
    )

    pressEscape(screen.getByRole('dialog'))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('asks the parent to close on the close button', async () => {
    const onClose = vi.fn()
    render(
      <Dialog title="Edit" onClose={onClose}>
        Content
      </Dialog>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Zamknij' }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('lets its content close it the same way', async () => {
    const onClose = vi.fn()
    render(
      <Dialog title="Edit" onClose={onClose}>
        <CloseFromContent />
      </Dialog>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Gotowe' }))

    expect(screen.getByRole('dialog')).toHaveAttribute('data-closing')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('plays the exit animation before asking to close, and asks once', async () => {
    const onClose = vi.fn()
    render(
      <Dialog title="Edit" onClose={onClose}>
        Content
      </Dialog>,
    )
    const dialog = screen.getByRole('dialog')
    const finishExit = holdAnimation(dialog)

    await userEvent.click(screen.getByRole('button', { name: 'Zamknij' }))
    pressEscape(dialog)

    expect(dialog).toHaveAttribute('data-closing')
    expect(onClose).not.toHaveBeenCalled()
    await finishExit()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('cannot be closed while closing is disabled', () => {
    const onClose = vi.fn()
    render(
      <Dialog title="Edit" onClose={onClose} closeDisabled>
        Content
      </Dialog>,
    )

    pressEscape(screen.getByRole('dialog'))

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).not.toHaveAttribute('data-closing')
    expect(screen.getByRole('button', { name: 'Zamknij' })).toBeDisabled()
  })

  it('follows a close forced by the browser', () => {
    const onClose = vi.fn()
    render(
      <Dialog title="Edit" onClose={onClose}>
        Content
      </Dialog>,
    )
    const dialog = screen.getByRole('dialog')

    dialog.removeAttribute('open')
    fireEvent(dialog, new Event('close'))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('returns focus to the element that opened it', () => {
    const { rerender } = render(<button type="button">Open</button>)
    screen.getByRole('button', { name: 'Open' }).focus()

    rerender(
      <>
        <button type="button">Open</button>
        <Dialog title="Edit" onClose={vi.fn()}>
          Content
        </Dialog>
      </>,
    )
    rerender(<button type="button">Open</button>)

    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
  })

  it("keeps the page scrollbar's space while open, so the page does not shift", () => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(window.innerWidth - 15)
    const root = document.documentElement

    const { unmount } = render(
      <Dialog title="Edit" onClose={vi.fn()}>
        Content
      </Dialog>,
    )
    expect(root.style.scrollbarGutter).toBe('stable')

    unmount()
    expect(root.style.scrollbarGutter).toBe('')
  })

  it('reserves no scrollbar space on a page without a scrollbar', () => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(window.innerWidth)

    render(
      <Dialog title="Edit" onClose={vi.fn()}>
        Content
      </Dialog>,
    )

    expect(document.documentElement.style.scrollbarGutter).toBe('')
  })
})

describe('useCloseDialog', () => {
  it('fails outside a Dialog', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<CloseFromContent />)).toThrow(
      'useCloseDialog must be used inside a Dialog',
    )
  })
})
