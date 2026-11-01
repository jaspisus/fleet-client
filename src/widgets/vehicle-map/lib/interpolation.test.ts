import { describe, expect, it } from 'vitest'
import { position } from '@/shared/test'
import {
  headingDelta,
  interpolatePosition,
  isTweenRunning,
  MAX_TWEEN_MS,
  planTween,
  tweenPositionAt,
} from './interpolation'

const from = { longitude: 18.5, latitude: 54.5, heading: 350 }
const to = { longitude: 18.6, latitude: 54.4, heading: 10 }

describe('headingDelta', () => {
  it.each([
    [350, 10, 20],
    [10, 350, -20],
    [0, 180, -180],
    [90, 90, 0],
    [0, 270, -90],
  ])('from %i° to %i° turns %i°', (start, end, delta) => {
    expect(headingDelta(start, end)).toBe(delta)
  })
})

describe('interpolatePosition', () => {
  it('moves in a straight line and turns the shorter way', () => {
    const halfway = interpolatePosition(from, to, 0.5)
    expect(halfway.longitude).toBeCloseTo(18.55)
    expect(halfway.latitude).toBeCloseTo(54.45)
    expect(halfway.heading).toBeCloseTo(0)
  })

  it('clamps the progress', () => {
    expect(interpolatePosition(from, to, -1)).toEqual(from)
    expect(interpolatePosition(from, to, 2)).toEqual({ ...to, heading: 10 })
  })
})

describe('planTween', () => {
  const previousReport = position('a', { lastReportedTime: '2026-10-30T09:15:00.000Z' })
  const nextReport = position('a', {
    longitude: 18.6,
    latitude: 54.4,
    heading: 10,
    lastReportedTime: '2026-10-30T09:15:04.000Z',
  })

  it('animates from the drawn position over the time between reports', () => {
    const tween = planTween({ current: from, previousReport, nextReport, now: 1000, animate: true })

    expect(tween).toEqual({ from, to, startedAt: 1000, durationMs: 4000 })
    expect(tweenPositionAt(tween, 3000).longitude).toBeCloseTo(18.55)
    expect(isTweenRunning(tween, 3000)).toBe(true)
    expect(isTweenRunning(tween, 5000)).toBe(false)
    expect(tweenPositionAt(tween, 9000)).toEqual(to)
  })

  it('jumps on the first report', () => {
    const tween = planTween({
      current: undefined,
      previousReport: undefined,
      nextReport,
      now: 0,
      animate: true,
    })
    expect(tween.durationMs).toBe(0)
    expect(tweenPositionAt(tween, 0)).toEqual(to)
  })

  it('jumps after a long silence', () => {
    const late = { ...nextReport, lastReportedTime: '2026-10-30T09:16:00.000Z' }
    const tween = planTween({
      current: from,
      previousReport,
      nextReport: late,
      now: 0,
      animate: true,
    })
    expect(60_000).toBeGreaterThan(MAX_TWEEN_MS)
    expect(tween.durationMs).toBe(0)
  })

  it('jumps when motion is reduced', () => {
    const tween = planTween({ current: from, previousReport, nextReport, now: 0, animate: false })
    expect(tween.durationMs).toBe(0)
    expect(isTweenRunning(tween, 0)).toBe(false)
  })
})
