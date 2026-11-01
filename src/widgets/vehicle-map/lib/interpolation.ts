import type { LiveTrackPosition } from '@/entities/vehicle-position'

export interface DisplayedPosition {
  longitude: number
  latitude: number
  heading: number
}

export interface Tween {
  from: DisplayedPosition
  to: DisplayedPosition
  /** `performance.now()` time the movement started. */
  startedAt: number
  durationMs: number
}

/** Reports further apart than this are not animated: the vehicle jumps to its new position. */
export const MAX_TWEEN_MS = 5_000

const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress

/** Heading change the shorter way round: from 350° to 10° is +20°, not −340°. */
export const headingDelta = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180

export const interpolatePosition = (
  from: DisplayedPosition,
  to: DisplayedPosition,
  progress: number,
): DisplayedPosition => {
  const clamped = Math.min(1, Math.max(0, progress))
  return {
    longitude: lerp(from.longitude, to.longitude, clamped),
    latitude: lerp(from.latitude, to.latitude, clamped),
    heading: (from.heading + headingDelta(from.heading, to.heading) * clamped + 360) % 360,
  }
}

export const toDisplayedPosition = ({
  longitude,
  latitude,
  heading,
}: LiveTrackPosition): DisplayedPosition => ({ longitude, latitude, heading })

interface PlanTweenOptions {
  /** Where the vehicle is drawn right now, if it is drawn at all. */
  current: DisplayedPosition | undefined
  previousReport: LiveTrackPosition | undefined
  nextReport: LiveTrackPosition
  now: number
  animate: boolean
}

/**
 * Plans the movement to a newly reported position. Driving vehicles report every 3–5 s, so the
 * marker travels from where it is drawn to the new report over the time between the two reports:
 * it arrives about when the next report comes in, and keeps moving smoothly in between.
 * The first report, long gaps (e.g. parked heartbeats) and reduced motion jump instead.
 */
export const planTween = ({
  current,
  previousReport,
  nextReport,
  now,
  animate,
}: PlanTweenOptions): Tween => {
  const target = toDisplayedPosition(nextReport)
  const gapMs = previousReport
    ? Date.parse(nextReport.lastReportedTime) - Date.parse(previousReport.lastReportedTime)
    : 0
  const shouldAnimate = animate && current !== undefined && gapMs > 0 && gapMs <= MAX_TWEEN_MS
  return {
    from: current ?? target,
    to: target,
    startedAt: now,
    durationMs: shouldAnimate ? gapMs : 0,
  }
}

export const tweenPositionAt = (tween: Tween, now: number): DisplayedPosition =>
  tween.durationMs === 0
    ? tween.to
    : interpolatePosition(tween.from, tween.to, (now - tween.startedAt) / tween.durationMs)

export const isTweenRunning = (tween: Tween, now: number) =>
  tween.durationMs > 0 && now < tween.startedAt + tween.durationMs
