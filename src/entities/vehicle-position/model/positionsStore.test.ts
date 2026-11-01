import { describe, expect, it } from 'vitest'
import { NOW, position } from '@/shared/test'
import { mergePositions, upsertPositions, usePositionsStore } from './positionsStore'

const at = (secondsAgo: number) => new Date(NOW - secondsAgo * 1000).toISOString()

describe('mergePositions', () => {
  it('adds new vehicles and replaces older reports', () => {
    const current = { a: position('a', { lastReportedTime: at(10), speed: 10 }) }
    const newer = position('a', { lastReportedTime: at(5), speed: 20 })
    const other = position('b')

    expect(mergePositions(current, [newer, other])).toEqual({ a: newer, b: other })
  })

  it('keeps a newer report when an older one arrives later (e.g. the snapshot)', () => {
    const newer = position('a', { lastReportedTime: at(5) })
    const current = { a: newer }

    const result = mergePositions(current, [position('a', { lastReportedTime: at(30) })])

    expect(result.a).toBe(newer)
  })

  it('returns the same object when nothing changed', () => {
    const current = { a: position('a') }

    expect(mergePositions(current, [position('a')])).toBe(current)
    expect(mergePositions(current, [])).toBe(current)
  })
})

describe('usePositionsStore', () => {
  it('stores positions by vehicle', () => {
    upsertPositions([position('a'), position('b')])

    expect(Object.keys(usePositionsStore.getState().positions)).toEqual(['a', 'b'])
  })

  it('does not notify subscribers about stale updates', () => {
    upsertPositions([position('a')])
    const before = usePositionsStore.getState()

    upsertPositions([position('a', { lastReportedTime: at(60) })])

    expect(usePositionsStore.getState()).toBe(before)
  })
})
