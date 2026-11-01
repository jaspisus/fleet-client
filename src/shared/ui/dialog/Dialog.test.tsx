import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

const pressEscape = (dialog: HTMLElement) =>
  fireEvent(dialog, new Event('cancel', { cancelable: true }))

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

  it('asks the parent to close on Esc and on the close button', async () => {
    const onClose = vi.fn()
    render(
      <Dialog title="Edit" onClose={onClose}>
        Content
      </Dialog>,
    )

    pressEscape(screen.getByRole('dialog'))
    await userEvent.click(screen.getByRole('button', { name: 'Zamknij' }))

    expect(onClose).toHaveBeenCalledTimes(2)
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
})
