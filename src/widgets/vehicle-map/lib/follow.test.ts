import type { MapInstance } from 'react-map-gl/maplibre'
import { describe, expect, it, vi } from 'vitest'
import { followVehicle } from './follow'

const vehicle = { longitude: 18.53, latitude: 54.52, heading: 90 }

const fakeMap = ({ zoom = 11, moving = false, center = { lng: 18.5, lat: 54.4 } } = {}) => {
  const map = {
    getZoom: () => zoom,
    isMoving: () => moving,
    getCenter: () => center,
    flyTo: vi.fn(),
    jumpTo: vi.fn(),
  }
  return { map, instance: map as unknown as MapInstance }
}

describe('followVehicle', () => {
  it('flies to the vehicle and zooms in when following starts', () => {
    const { map, instance } = fakeMap()

    const again = followVehicle(instance, vehicle, { start: true, animate: true, held: false })

    expect(map.flyTo).toHaveBeenCalledWith({ center: [18.53, 54.52], zoom: 15, duration: 1_000 })
    expect(map.jumpTo).not.toHaveBeenCalled()
    expect(again).toBe(true)
  })

  it('keeps a closer zoom when following starts', () => {
    const { map, instance } = fakeMap({ zoom: 17 })

    followVehicle(instance, vehicle, { start: true, animate: true, held: false })

    expect(map.flyTo).toHaveBeenCalledWith(expect.objectContaining({ zoom: 17 }))
  })

  it('jumps instead of flying with reduced motion', () => {
    const { map, instance } = fakeMap()

    followVehicle(instance, vehicle, { start: true, animate: false, held: false })

    expect(map.jumpTo).toHaveBeenCalledWith({ center: [18.53, 54.52], zoom: 15 })
    expect(map.flyTo).not.toHaveBeenCalled()
  })

  it('keeps the moving vehicle centred on later frames', () => {
    const { map, instance } = fakeMap()

    const again = followVehicle(instance, vehicle, { start: false, animate: true, held: false })

    expect(map.jumpTo).toHaveBeenCalledWith({ center: [18.53, 54.52] })
    expect(again).toBe(false)
  })

  it('does not jump when the vehicle is already centred', () => {
    const { map, instance } = fakeMap({ center: { lng: 18.53, lat: 54.52 } })

    expect(followVehicle(instance, vehicle, { start: false, animate: true, held: false })).toBe(
      false,
    )
    expect(map.jumpTo).not.toHaveBeenCalled()
  })

  it('waits for the camera to stop moving, asking for another frame', () => {
    const { map, instance } = fakeMap({ moving: true })

    const again = followVehicle(instance, vehicle, { start: false, animate: true, held: false })

    expect(map.jumpTo).not.toHaveBeenCalled()
    expect(again).toBe(true)
  })

  it('waits while a pointer is down on the map, without asking for frames', () => {
    const { map, instance } = fakeMap()

    const again = followVehicle(instance, vehicle, { start: false, animate: true, held: true })

    expect(map.jumpTo).not.toHaveBeenCalled()
    expect(again).toBe(false)
  })
})
