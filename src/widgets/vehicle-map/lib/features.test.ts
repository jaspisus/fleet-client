import { describe, expect, it } from 'vitest'
import { NOW, position, sprinter01, sprinter02, transit05 } from '@/shared/test'
import { getClickedVehicleId, toVehicleFeatureCollection } from './features'

describe('toVehicleFeatureCollection', () => {
  const reported = {
    [sprinter01.id]: position(sprinter01.id, { speed: 30, heading: 90 }),
    [sprinter02.id]: position(sprinter02.id, { speed: 0, longitude: 18.6, latitude: 54.4 }),
  }

  it('draws a point per vehicle with a position, with its status and selection', () => {
    const collection = toVehicleFeatureCollection({
      vehicles: [sprinter01, sprinter02, transit05],
      reported,
      displayed: new Map(),
      selectedVehicleId: sprinter02.id,
      now: NOW,
    })

    expect(collection.features.map((feature) => feature.properties)).toEqual([
      { vehicleId: sprinter01.id, status: 'moving', heading: 90, selected: false },
      { vehicleId: sprinter02.id, status: 'parked', heading: 152, selected: true },
    ])
    expect(collection.features[1]?.geometry.coordinates).toEqual([18.6, 54.4])
  })

  it('prefers the animated position over the reported one', () => {
    const collection = toVehicleFeatureCollection({
      vehicles: [sprinter01],
      reported,
      displayed: new Map([[sprinter01.id, { longitude: 18.1, latitude: 54.1, heading: 45 }]]),
      selectedVehicleId: null,
      now: NOW,
    })

    expect(collection.features[0]?.geometry.coordinates).toEqual([18.1, 54.1])
    expect(collection.features[0]?.properties.heading).toBe(45)
  })
})

describe('getClickedVehicleId', () => {
  it('returns the vehicle under the click', () => {
    expect(getClickedVehicleId([{ properties: { vehicleId: 'a' } }])).toBe('a')
  })

  it('returns null for the empty map', () => {
    expect(getClickedVehicleId([])).toBeNull()
    expect(getClickedVehicleId(undefined)).toBeNull()
    expect(getClickedVehicleId([{ properties: null }])).toBeNull()
  })
})
