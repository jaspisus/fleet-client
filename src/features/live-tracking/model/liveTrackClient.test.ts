import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeConnections, position, type FakeHubConnection } from '@/shared/test'
import { createLiveTrackClient } from './liveTrackClient'

vi.mock('@microsoft/signalr', async () => (await import('@/shared/test')).fakeSignalRModule())

const setup = () => {
  const onPositions = vi.fn()
  const onStatusChange = vi.fn()
  const client = createLiveTrackClient({
    url: 'http://fleet-api.test/tracking',
    vehicleIds: ['a', 'b'],
    onPositions,
    onStatusChange,
  })
  const connection = fakeConnections.at(-1) as FakeHubConnection
  return { client, connection, onPositions, onStatusChange }
}

describe('createLiveTrackClient', () => {
  beforeEach(() => {
    fakeConnections.length = 0
  })

  it('connects, subscribes to the vehicles and applies the snapshot', async () => {
    const { client, connection, onPositions, onStatusChange } = setup()
    connection.snapshot = [position('a')]

    await client.start()

    expect(connection.url).toBe('http://fleet-api.test/tracking')
    expect(connection.invoke).toHaveBeenCalledWith('SubscribeLiveTrack', ['a', 'b'])
    expect(onPositions).toHaveBeenCalledWith([position('a')])
    expect(onStatusChange.mock.calls.map(([status]) => status)).toEqual(['connecting', 'live'])
  })

  it('passes on LiveTrack events', async () => {
    const { client, connection, onPositions } = setup()
    await client.start()

    connection.emit('LiveTrack', [position('b', { speed: 12 })])

    expect(onPositions).toHaveBeenLastCalledWith([position('b', { speed: 12 })])
  })

  it('subscribes again after reconnecting, because subscriptions belong to a connection', async () => {
    const { client, connection, onStatusChange } = setup()
    await client.start()

    connection.simulateReconnecting()
    expect(onStatusChange).toHaveBeenLastCalledWith('reconnecting')
    connection.simulateReconnected()

    expect(onStatusChange).toHaveBeenLastCalledWith('reconnecting')
    await vi.waitFor(() => expect(onStatusChange).toHaveBeenLastCalledWith('live'))
    expect(connection.invoke).toHaveBeenCalledTimes(2)
  })

  it('stops the connection if subscribing again after a reconnect fails', async () => {
    const { client, connection, onStatusChange } = setup()
    await client.start()
    connection.invoke.mockRejectedValueOnce(new Error('hub error'))

    connection.simulateReconnecting()
    connection.simulateReconnected()

    await vi.waitFor(() => expect(connection.stop).toHaveBeenCalled())
    expect(onStatusChange.mock.calls.map(([status]) => status)).toEqual([
      'connecting',
      'live',
      'reconnecting',
      'disconnected',
    ])
  })

  it('reports a lost connection', async () => {
    const { client, connection, onStatusChange } = setup()
    await client.start()

    connection.simulateClose()

    expect(onStatusChange).toHaveBeenLastCalledWith('disconnected')
  })

  it('reports a failed start and rethrows it', async () => {
    const { client, connection, onStatusChange } = setup()
    connection.start.mockRejectedValueOnce(new Error('refused'))

    await expect(client.start()).rejects.toThrow('refused')
    expect(onStatusChange).toHaveBeenLastCalledWith('disconnected')
  })

  it('stops the connection if the subscription fails', async () => {
    const { client, connection } = setup()
    connection.invoke.mockRejectedValueOnce(new Error('hub error'))

    await expect(client.start()).rejects.toThrow('hub error')
    expect(connection.stop).toHaveBeenCalled()
  })

  it('stays silent after stop, also when stopping interrupts the start', async () => {
    const { client, connection, onPositions, onStatusChange } = setup()
    connection.start.mockImplementationOnce(async () => {
      await client.stop()
      throw new Error('The connection was stopped during negotiation.')
    })

    await expect(client.start()).resolves.toBeUndefined()
    connection.emit('LiveTrack', [position('a')])
    connection.simulateClose()

    expect(onPositions).not.toHaveBeenCalled()
    expect(onStatusChange.mock.calls.map(([status]) => status)).toEqual(['connecting'])
  })
})
