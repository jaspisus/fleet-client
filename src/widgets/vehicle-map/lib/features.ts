import type { FeatureCollection, Point } from 'geojson'
import type { Vehicle } from '@/entities/vehicle'
import {
  getVehicleStatus,
  type PositionsById,
  type VehicleStatus,
} from '@/entities/vehicle-position'
import { toDisplayedPosition, type DisplayedPosition } from './interpolation'

export interface VehicleFeatureProperties {
  vehicleId: string
  status: VehicleStatus
  heading: number
  selected: boolean
}

export type VehicleFeatureCollection = FeatureCollection<Point, VehicleFeatureProperties>

export const EMPTY_FEATURE_COLLECTION: VehicleFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

interface FeatureCollectionInput {
  vehicles: readonly Vehicle[]
  /** Last reported positions; they decide the status. */
  reported: PositionsById
  /** Animated positions to draw; vehicles without one are drawn at their reported position. */
  displayed: ReadonlyMap<string, DisplayedPosition>
  selectedVehicleId: string | null
  now: number
}

/** One point per vehicle that has a position; vehicles without any are left off the map. */
export const toVehicleFeatureCollection = ({
  vehicles,
  reported,
  displayed,
  selectedVehicleId,
  now,
}: FeatureCollectionInput): VehicleFeatureCollection => ({
  type: 'FeatureCollection',
  features: vehicles.flatMap((vehicle) => {
    const report = reported[vehicle.id]
    const shown = displayed.get(vehicle.id) ?? (report && toDisplayedPosition(report))
    if (!shown) return []
    return [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [shown.longitude, shown.latitude] },
        properties: {
          vehicleId: vehicle.id,
          status: getVehicleStatus(report, now),
          heading: shown.heading,
          selected: vehicle.id === selectedVehicleId,
        },
      },
    ]
  }),
})

/** The vehicle under a map click, or `null` for a click on the empty map. */
export const getClickedVehicleId = (
  features: ReadonlyArray<{ properties?: Record<string, unknown> | null }> | undefined,
) => {
  const vehicleId = features?.[0]?.properties?.vehicleId
  return typeof vehicleId === 'string' ? vehicleId : null
}
