import type { MapInstance } from 'react-map-gl/maplibre'
import type { DisplayedPosition } from './interpolation'

const FOLLOW_FLY_MS = 1_000
const FOLLOW_ZOOM = 15

interface FollowVehicleOptions {
  start: boolean
  animate: boolean
  held: boolean
}

/**
 * Centres the camera on a followed vehicle: on `start` flies there and zooms in to at least
 * `FOLLOW_ZOOM`, on later frames jumps to it unless the map is `held` (a pointer is down on it).
 * Returns whether another frame is needed.
 */
export const followVehicle = (
  map: MapInstance,
  position: DisplayedPosition,
  { start, animate, held }: FollowVehicleOptions,
): boolean => {
  const center: [number, number] = [position.longitude, position.latitude]
  if (start) {
    const zoom = Math.max(map.getZoom(), FOLLOW_ZOOM)
    if (animate) map.flyTo({ center, zoom, duration: FOLLOW_FLY_MS })
    else map.jumpTo({ center, zoom })
    return true
  }
  // `jumpTo` stops an ease, a zoom gesture or a drag that has not passed its start threshold yet.
  if (held || map.isMoving()) return true
  const current = map.getCenter()
  if (current.lng !== center[0] || current.lat !== center[1]) map.jumpTo({ center })
  return false
}
