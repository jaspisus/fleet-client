import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubReducedMotion } from '@/shared/test'
import { LOADER_DURATION_MS, VehiclesLoader } from './VehiclesLoader'

describe('VehiclesLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('announces that vehicles are loading', () => {
    render(<VehiclesLoader loaded={false} onFinish={vi.fn()} />)

    expect(screen.getByRole('status')).toHaveTextContent('Ładowanie pojazdów…')
  })

  it('stays for its whole duration even when the data is already there', () => {
    const onFinish = vi.fn()
    render(<VehiclesLoader loaded onFinish={onFinish} />)

    act(() => vi.advanceTimersByTime(LOADER_DURATION_MS - 1))
    expect(onFinish).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(onFinish).toHaveBeenCalledOnce()
  })

  it('waits for the data after its duration', () => {
    const onFinish = vi.fn()
    const { rerender } = render(<VehiclesLoader loaded={false} onFinish={onFinish} />)

    act(() => vi.advanceTimersByTime(LOADER_DURATION_MS * 3))
    expect(onFinish).not.toHaveBeenCalled()

    rerender(<VehiclesLoader loaded onFinish={onFinish} />)
    expect(onFinish).toHaveBeenCalledOnce()
  })

  it('finishes as soon as the data is there when motion is reduced', () => {
    stubReducedMotion()
    const onFinish = vi.fn()

    render(<VehiclesLoader loaded onFinish={onFinish} />)

    expect(onFinish).toHaveBeenCalledOnce()
  })
})
