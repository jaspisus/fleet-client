import { useEffect, useState } from 'react'
import { upsertPositions } from '@/entities/vehicle-position'
import { TRACKING_HUB_URL } from '@/shared/config'
import { createLiveTrackClient, type ConnectionStatus } from './liveTrackClient'

/**
 * Keeps a live connection to the tracking hub for as long as the calling component is mounted,
 * and writes every received position into the positions store.
 */
export const useLiveTracking = (vehicleIds: readonly string[]) => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [attempt, setAttempt] = useState(0)
  // A string key, so a new array with the same IDs does not reconnect.
  const vehicleIdsKey = vehicleIds.join(',')

  useEffect(() => {
    if (vehicleIdsKey === '') return
    const client = createLiveTrackClient({
      url: TRACKING_HUB_URL,
      vehicleIds: vehicleIdsKey.split(','),
      onPositions: upsertPositions,
      onStatusChange: setStatus,
    })
    // Starting on the next tick lets an immediate unmount (StrictMode's mount-unmount-mount)
    // cancel the start instead of aborting a negotiation that is already in flight.
    const startTimer = setTimeout(() => {
      client.start().catch((error: unknown) => {
        console.warn('Live tracking could not connect.', error)
      })
    }, 0)
    return () => {
      clearTimeout(startTimer)
      void client.stop()
    }
  }, [vehicleIdsKey, attempt])

  const reconnect = () => setAttempt((current) => current + 1)

  return { status, reconnect }
}
