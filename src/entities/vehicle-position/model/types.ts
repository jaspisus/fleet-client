/** A position pushed by the tracking hub (`LiveTrack` event or `SubscribeLiveTrack` snapshot). */
export interface LiveTrackPosition {
  vehicleId: string
  /** WGS 84, degrees. */
  latitude: number
  longitude: number
  /** Direction of travel, 0–359: 0 = north, 90 = east. */
  heading: number
  /** km/h. */
  speed: number
  /** ISO 8601, UTC. */
  lastReportedTime: string
}
