import { useEffect, useEffectEvent, useRef } from 'react'
import type { GeoJSONSource } from 'maplibre-gl'
import type { MapInstance } from 'react-map-gl/maplibre'
import type { Vehicle } from '@/entities/vehicle'
import type { PositionsById } from '@/entities/vehicle-position'
import { toVehicleFeatureCollection } from './features'
import { followVehicle } from './follow'
import {
  isTweenRunning,
  planTween,
  tweenPositionAt,
  type DisplayedPosition,
  type Tween,
} from './interpolation'
import { VEHICLE_SOURCE_ID } from './layers'

interface UseAnimatedVehiclesOptions {
  map: MapInstance | null
  vehicles: readonly Vehicle[]
  positions: PositionsById
  selectedVehicleId: string | null
  followVehicleId: string | null
  now: number
  animate: boolean
}

/**
 * Draws the vehicles into the GeoJSON source, animates them between reports and moves the camera
 * with the followed vehicle.
 */
export const useAnimatedVehicles = ({
  map,
  vehicles,
  positions,
  selectedVehicleId,
  followVehicleId,
  now,
  animate,
}: UseAnimatedVehiclesOptions) => {
  const tweensRef = useRef(new Map<string, Tween>())
  const lastReportsRef = useRef<PositionsById>({})
  const frameRef = useRef<number | null>(null)
  const followedIdRef = useRef<string | null>(null)
  const pointerDownRef = useRef(false)

  /** Draws one frame; returns whether another frame is needed. */
  const drawFrame = useEffectEvent((time: number): boolean => {
    if (!map) return false
    const source = map.getSource<GeoJSONSource>(VEHICLE_SOURCE_ID)
    // The source is added once the style has loaded; try again on the next frame.
    if (!source) return true

    const displayed = new Map<string, DisplayedPosition>()
    let running = false
    for (const [vehicleId, tween] of tweensRef.current) {
      displayed.set(vehicleId, tweenPositionAt(tween, time))
      running ||= isTweenRunning(tween, time)
    }
    source.setData(
      toVehicleFeatureCollection({
        vehicles,
        reported: positions,
        displayed,
        selectedVehicleId,
        now,
      }),
    )

    const followed = followVehicleId === null ? undefined : displayed.get(followVehicleId)
    if (followed) {
      const start = followedIdRef.current !== followVehicleId
      followedIdRef.current = followVehicleId
      running =
        followVehicle(map, followed, { start, animate, held: pointerDownRef.current }) || running
    } else {
      followedIdRef.current = null
    }
    return running
  })

  const requestDraw = useEffectEvent(() => {
    if (frameRef.current !== null) return
    function loop(time: number) {
      frameRef.current = drawFrame(time) ? requestAnimationFrame(loop) : null
    }
    frameRef.current = requestAnimationFrame(loop)
  })

  useEffect(() => {
    const time = performance.now()
    const tweens = tweensRef.current
    for (const [vehicleId, report] of Object.entries(positions)) {
      const previousReport = lastReportsRef.current[vehicleId]
      if (previousReport === report) continue
      const running = tweens.get(vehicleId)
      tweens.set(
        vehicleId,
        planTween({
          current: running && tweenPositionAt(running, time),
          previousReport,
          nextReport: report,
          now: time,
          animate,
        }),
      )
    }
    lastReportsRef.current = positions
    requestDraw()
  }, [positions, animate])

  useEffect(() => {
    if (!map) return
    const container = map.getCanvasContainer()
    const press = () => {
      pointerDownRef.current = true
    }
    const release = () => {
      pointerDownRef.current = false
      requestDraw()
    }
    container.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    return () => {
      container.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
  }, [map])

  // Statuses, selection, following and the vehicle list need a frame even when no vehicle moves.
  useEffect(() => {
    requestDraw()
  }, [map, vehicles, selectedVehicleId, followVehicleId, now])

  useEffect(
    () => () => {
      if (frameRef.current === null) return
      cancelAnimationFrame(frameRef.current)
      // Reset, or a remount (StrictMode) would wait forever for the cancelled frame.
      frameRef.current = null
    },
    [],
  )
}
