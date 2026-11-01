import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePositionsStore } from '@/entities/vehicle-position'
import { fakeConnections, position, type FakeHubConnection } from '@/shared/test'
import { useLiveTracking } from './useLiveTracking'

vi.mock('@microsoft/signalr', async () => (await import('@/shared/test')).fakeSignalRModule())

const lastConnection = () => fakeConnections.at(-1) as FakeHubConnection

describe('useLiveTracking', () => {
  beforeEach(() => {
    fakeConnections.length = 0
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for vehicle IDs before connecting', () => {
    renderHook(() => useLiveTracking([]))

    expect(fakeConnections).toHaveLength(0)
  })

  it('connects, follows the vehicles and stores their positions', async () => {
    const { result } = renderHook(() => useLiveTracking(['a', 'b']))
    lastConnection().snapshot = [position('a')]

    await act(() => vi.runAllTimersAsync())

    expect(lastConnection().invoke).toHaveBeenCalledWith('SubscribeLiveTrack', ['a', 'b'])
    expect(result.current.status).toBe('live')
    expect(usePositionsStore.getState().positions.a).toEqual(position('a'))
  })

  it('never starts a connection that is unmounted right away (StrictMode)', async () => {
    const { unmount } = renderHook(() => useLiveTracking(['a']))
    unmount()

    await vi.runAllTimersAsync()

    expect(lastConnection().start).not.toHaveBeenCalled()
  })

  it('does not reconnect for a new array with the same IDs', async () => {
    const { rerender } = renderHook(({ ids }) => useLiveTracking(ids), {
      initialProps: { ids: ['a', 'b'] },
    })
    await act(() => vi.runAllTimersAsync())

    rerender({ ids: ['a', 'b'] })

    expect(fakeConnections).toHaveLength(1)
  })

  it('opens a fresh connection on reconnect', async () => {
    const { result } = renderHook(() => useLiveTracking(['a']))
    await act(() => vi.runAllTimersAsync())
    const first = lastConnection()

    act(() => first.simulateClose())
    expect(result.current.status).toBe('disconnected')
    act(() => result.current.reconnect())
    await act(() => vi.runAllTimersAsync())

    expect(first.stop).toHaveBeenCalled()
    expect(fakeConnections).toHaveLength(2)
    expect(result.current.status).toBe('live')
  })
})
