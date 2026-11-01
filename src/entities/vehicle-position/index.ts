export {
  mergePositions,
  upsertPositions,
  usePositions,
  usePositionsStore,
  type PositionsById,
} from './model/positionsStore'
export {
  getVehicleStatus,
  OFFLINE_AFTER_MS,
  STATUS_COLORS,
  type VehicleStatus,
} from './model/status'
export type { LiveTrackPosition } from './model/types'
export { VehicleStatusBadge } from './ui/VehicleStatusBadge'
