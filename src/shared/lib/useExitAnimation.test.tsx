import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { holdAnimation } from '@/shared/test'
import { useExitAnimation } from './useExitAnimation'

const Panel = ({ onExited }: { onExited: () => void }) => {
  const { ref, requestExit } = useExitAnimation<HTMLDivElement>(onExited)
  return (
    <div ref={ref} data-testid="panel">
      <button type="button" onClick={requestExit}>
        Close
      </button>
    </div>
  )
}

describe('useExitAnimation', () => {
  it('calls back at once when the element does not animate', async () => {
    const onExited = vi.fn()
    render(<Panel onExited={onExited} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.getByTestId('panel')).toHaveAttribute('data-closing')
    expect(onExited).toHaveBeenCalledOnce()
  })

  it('waits for the exit animation and calls back once', async () => {
    const onExited = vi.fn()
    render(<Panel onExited={onExited} />)
    const finishExit = holdAnimation(screen.getByTestId('panel'))

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onExited).not.toHaveBeenCalled()

    await finishExit()
    expect(onExited).toHaveBeenCalledOnce()
  })
})
