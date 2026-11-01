import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConnectionIndicator } from './ConnectionIndicator'

describe('ConnectionIndicator', () => {
  it('announces the connection status', () => {
    render(<ConnectionIndicator status="live" onReconnect={vi.fn()} />)

    expect(screen.getByRole('status')).toHaveTextContent('Połączenie: Na żywo')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('offers a retry once disconnected', async () => {
    const onReconnect = vi.fn()
    render(<ConnectionIndicator status="disconnected" onReconnect={onReconnect} />)

    await userEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }))

    expect(screen.getByRole('status')).toHaveTextContent('Rozłączono')
    expect(onReconnect).toHaveBeenCalled()
  })
})
