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
import { usePositionsStore, type PositionsById } from '@/entities/vehicle-position'
import { MAP_STYLE_URL } from '@/shared/config'
import { usePrefersReducedMotion } from '@/shared/lib'
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

/** Brings a newly selected vehicle into view, unless it is visible already. */
const useRevealSelectedVehicle = (
  map: MapInstance | null,
  selectedVehicleId: string | null,
  hasPosition: boolean,
  animate: boolean,
) => {
  useEffect(() => {
    if (!map || !selectedVehicleId || !hasPosition) return
    const position = usePositionsStore.getState().positions[selectedVehicleId]
    if (!position) return
    const center: [number, number] = [position.longitude, position.latitude]
    if (!map.getBounds().contains(center)) map.easeTo({ center, duration: animate ? 600 : 0 })
  }, [map, selectedVehicleId, hasPosition, animate])
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

  useAnimatedVehicles({ map, vehicles, positions, selectedVehicleId, now, animate })
  useRevealSelectedVehicle(
    map,
    selectedVehicleId,
    selectedVehicleId !== null && positions[selectedVehicleId] !== undefined,
    animate,
  )

  const handleLoad = (event: MapEvent) => {
    addArrowImage(event.target)
    setMap(event.target)
  }

  const handleClick = (event: MapLayerMouseEvent) => onSelect(getClickedVehicleId(event.features))

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
