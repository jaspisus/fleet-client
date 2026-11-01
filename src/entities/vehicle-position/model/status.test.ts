import { describe, expect, it } from 'vitest'
import { NOW, position } from '@/shared/test'
import { getVehicleStatus, OFFLINE_AFTER_MS } from './status'

const reportedAgo = (ms: number) => new Date(NOW - ms).toISOString()

describe('getVehicleStatus', () => {
  it('is "noSignal" without any position', () => {
    expect(getVehicleStatus(undefined, NOW)).toBe('noSignal')
  })

  it('is "moving" when a recent report has speed', () => {
    expect(getVehicleStatus(position('a', { speed: 30 }), NOW)).toBe('moving')
  })

  it('is "parked" when a recent report has no speed', () => {
    expect(getVehicleStatus(position('a', { speed: 0 }), NOW)).toBe('parked')
  })

  it('is "offline" once the last report is too old, whatever its speed', () => {
    const old = position('a', { speed: 30, lastReportedTime: reportedAgo(OFFLINE_AFTER_MS + 1) })
    expect(getVehicleStatus(old, NOW)).toBe('offline')
  })

  it('is still online right at the threshold', () => {
    const edge = position('a', { speed: 0, lastReportedTime: reportedAgo(OFFLINE_AFTER_MS) })
    expect(getVehicleStatus(edge, NOW)).toBe('parked')
  })
})
