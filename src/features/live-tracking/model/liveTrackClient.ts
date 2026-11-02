import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import type { LiveTrackPosition } from '@/entities/vehicle-position'

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'disconnected'

interface LiveTrackClientOptions {
  url: string
  vehicleIds: readonly string[]
  onPositions: (positions: LiveTrackPosition[]) => void
  onStatusChange: (status: ConnectionStatus) => void
}

export interface LiveTrackClient {
  start: () => Promise<void>
  stop: () => Promise<void>
}

/**
 * One SignalR connection to the tracking hub, following a fixed set of vehicles. After `stop()`
 * it reports nothing more.
 */
export const createLiveTrackClient = ({
  url,
  vehicleIds,
  onPositions,
  onStatusChange,
}: LiveTrackClientOptions): LiveTrackClient => {
  const connection = new HubConnectionBuilder()
    .withUrl(url)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()
  let stopped = false

  const report = (status: ConnectionStatus) => {
    if (!stopped) onStatusChange(status)
  }

  const subscribe = async () => {
    const snapshot = await connection.invoke<LiveTrackPosition[]>('SubscribeLiveTrack', [
      ...vehicleIds,
    ])
    if (!stopped) onPositions(snapshot)
  }

  connection.on('LiveTrack', (positions: LiveTrackPosition[]) => {
    if (!stopped) onPositions(positions)
  })
  connection.onreconnecting(() => report('reconnecting'))
  connection.onreconnected(() => {
    report('live')
    // A subscription belongs to the connection that made it.
    // If renewing fails the connection is broken anyway; onclose reports it.
    subscribe().catch(() => undefined)
  })
  connection.onclose(() => report('disconnected'))

  return {
    start: async () => {
      report('connecting')
      try {
        await connection.start()
        await subscribe()
      } catch (error) {
        // Stopping during the handshake rejects start(); that is expected, not a failure.
        if (stopped) return
        report('disconnected')
        if (connection.state !== HubConnectionState.Disconnected) await connection.stop()
        throw error
      }
      report('live')
    },
    stop: async () => {
      stopped = true
      await connection.stop()
    },
  }
}
