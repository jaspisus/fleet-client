import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useState } from 'react'
import Map, {
  Layer,
  NavigationControl,
  Source,
  type MapEvent,
  type MapInstance,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre'
import type { Vehicle } from '@/entities/vehicle'
import type { PositionsById } from '@/entities/vehicle-position'
import { MAP_STYLE_URL } from '@/shared/config'
import { usePrefersReducedMotion } from '@/shared/lib'
import { recolorBasemap } from '../lib/basemap'
import { EMPTY_FEATURE_COLLECTION, getClickedVehicleId } from '../lib/features'
import {
  addArrowImage,
  HEADING_ARROW_LAYER,
  SELECTED_HALO_LAYER,
  TRICITY_BOUNDS,
  VEHICLE_LAYER_ID,
  VEHICLE_POINT_LAYER,
  VEHICLE_SOURCE_ID,
} from '../lib/layers'
import { maplibre } from '../lib/maplibre'
import { useAnimatedVehicles } from '../lib/useAnimatedVehicles'

const INITIAL_VIEW_STATE = { bounds: TRICITY_BOUNDS, fitBoundsOptions: { padding: 24 } }
const INTERACTIVE_LAYER_IDS = [VEHICLE_LAYER_ID]
const MAP_STYLE = { width: '100%', height: '100%' }

/** Returns the vehicle the camera follows, with callbacks that pause and resume following. */
const useFollowedVehicle = (selectedVehicleId: string | null) => {
  const [pause, setPause] = useState({ selectedVehicleId, paused: false })
  if (pause.selectedVehicleId !== selectedVehicleId) {
    setPause({ selectedVehicleId, paused: false })
  }
  return {
    followVehicleId: pause.paused ? null : selectedVehicleId,
    pauseFollowing: () => setPause({ selectedVehicleId, paused: true }),
    resumeFollowing: () => setPause({ selectedVehicleId, paused: false }),
  }
}

/** Makes scroll and pinch zoom keep the map centre in place while `aroundCenter` is set. */
const useZoomAroundCenter = (map: MapInstance | null, aroundCenter: boolean) => {
  useEffect(() => {
    if (!map) return
    const options = aroundCenter ? { around: 'center' as const } : undefined
    // `enable()` ignores new options while the handler is already enabled.
    map.scrollZoom.disable()
    map.scrollZoom.enable(options)
    map.touchZoomRotate.disable()
    map.touchZoomRotate.enable(options)
  }, [map, aroundCenter])
}

export interface VehicleMapCanvasProps {
  vehicles: readonly Vehicle[]
  positions: PositionsById
  selectedVehicleId: string | null
  now: number
  onSelect: (vehicleId: string | null) => void
}

export const VehicleMapCanvas = ({
  vehicles,
  positions,
  selectedVehicleId,
  now,
  onSelect,
}: VehicleMapCanvasProps) => {
  const [map, setMap] = useState<MapInstance | null>(null)
  const [cursor, setCursor] = useState<string>()
  const animate = !usePrefersReducedMotion()

  const { followVehicleId, pauseFollowing, resumeFollowing } = useFollowedVehicle(selectedVehicleId)

  useAnimatedVehicles({
    map,
    vehicles,
    positions,
    selectedVehicleId,
    followVehicleId,
    now,
    animate,
  })
  useZoomAroundCenter(map, followVehicleId !== null)

  const handleLoad = (event: MapEvent) => {
    recolorBasemap(event.target)
    addArrowImage(event.target)
    setMap(event.target)
  }

  const handleClick = (event: MapLayerMouseEvent) => {
    const vehicleId = getClickedVehicleId(event.features)
    if (vehicleId !== null && vehicleId === selectedVehicleId) resumeFollowing()
    onSelect(vehicleId)
  }

  return (
    <Map
      mapLib={maplibre}
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE_URL}
      style={MAP_STYLE}
      interactiveLayerIds={INTERACTIVE_LAYER_IDS}
      cursor={cursor}
      dragRotate={false}
      touchPitch={false}
      attributionControl={{ compact: true }}
      onLoad={handleLoad}
      onClick={handleClick}
      onDragStart={pauseFollowing}
      onMouseEnter={() => setCursor('pointer')}
      onMouseLeave={() => setCursor(undefined)}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <Source id={VEHICLE_SOURCE_ID} type="geojson" data={EMPTY_FEATURE_COLLECTION}>
        <Layer {...SELECTED_HALO_LAYER} />
        <Layer {...VEHICLE_POINT_LAYER} />
        <Layer {...HEADING_ARROW_LAYER} />
      </Source>
    </Map>
  )
}
