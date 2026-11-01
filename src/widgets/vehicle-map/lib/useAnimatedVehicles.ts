import { useEffect, useEffectEvent, useRef } from 'react'
import type { GeoJSONSource } from 'maplibre-gl'
import type { MapInstance } from 'react-map-gl/maplibre'
import type { Vehicle } from '@/entities/vehicle'
import type { PositionsById } from '@/entities/vehicle-position'
import { toVehicleFeatureCollection } from './features'
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
  now: number
  animate: boolean
}

/**
 * Draws the vehicles into the GeoJSON source and animates them between reports. Frames write to
 * the map source directly instead of going through React state, and the loop runs only while
 * some vehicle is still moving towards its latest report.
 */
export const useAnimatedVehicles = ({
  map,
  vehicles,
  positions,
  selectedVehicleId,
  now,
  animate,
}: UseAnimatedVehiclesOptions) => {
  const tweensRef = useRef(new Map<string, Tween>())
  const lastReportsRef = useRef<PositionsById>({})
  const frameRef = useRef<number | null>(null)

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
    return running
  })

  const requestDraw = useEffectEvent(() => {
    if (frameRef.current !== null) return
    function loop(time: number) {
      frameRef.current = drawFrame(time) ? requestAnimationFrame(loop) : null
    }
    frameRef.current = requestAnimationFrame(loop)
  })

  // Start a movement for every vehicle with a new report.
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

  // Statuses, selection and the vehicle list change the drawing without moving anything.
  useEffect(() => {
    requestDraw()
  }, [map, vehicles, selectedVehicleId, now])

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
