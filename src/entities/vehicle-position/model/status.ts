import type { BadgeTone } from '@/shared/ui'
import type { LiveTrackPosition } from './types'

export type VehicleStatus = 'moving' | 'parked' | 'offline' | 'noSignal'

/** Parked vehicles still report every 60 s, so five minutes of silence means the tracker is off. */
export const OFFLINE_AFTER_MS = 5 * 60_000

export const getVehicleStatus = (
  position: LiveTrackPosition | undefined,
  now: number,
): VehicleStatus => {
  if (!position) return 'noSignal'
  if (now - Date.parse(position.lastReportedTime) > OFFLINE_AFTER_MS) return 'offline'
  return position.speed > 0 ? 'moving' : 'parked'
}

/** Map marker colours; the same values as the status tokens in app/styles/tokens.css. */
export const STATUS_COLORS: Record<VehicleStatus, string> = {
  moving: '#6fd3bf',
  parked: '#f4c381',
  offline: '#7a9398',
  noSignal: '#e2704f',
}

export const STATUS_BADGE_TONES: Record<VehicleStatus, BadgeTone> = {
  moving: 'success',
  parked: 'info',
  offline: 'neutral',
  noSignal: 'warning',
}
