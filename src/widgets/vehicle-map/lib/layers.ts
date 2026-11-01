import type { ExpressionSpecification } from 'maplibre-gl'
import type { LayerProps, MapInstance } from 'react-map-gl/maplibre'
import { STATUS_COLORS } from '@/entities/vehicle-position'

export const VEHICLE_SOURCE_ID = 'vehicles'
export const VEHICLE_LAYER_ID = 'vehicle-points'
export const ARROW_IMAGE_ID = 'vehicle-heading-arrow'

/** Gdynia, Sopot and Gdańsk, where the vehicles drive. */
export const TRICITY_BOUNDS: [[number, number], [number, number]] = [
  [18.42, 54.32],
  [18.72, 54.56],
]

const MARKER_OUTLINE = '#0e1116'
const HALO_COLOR = '#ffffff'

const statusColor: ExpressionSpecification = [
  'match',
  ['get', 'status'],
  'moving',
  STATUS_COLORS.moving,
  'parked',
  STATUS_COLORS.parked,
  'offline',
  STATUS_COLORS.offline,
  STATUS_COLORS.noSignal,
]

const isSelected: ExpressionSpecification = ['==', ['get', 'selected'], true]

export const SELECTED_HALO_LAYER: LayerProps = {
  id: 'vehicle-selected-halo',
  type: 'circle',
  filter: isSelected,
  paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 12, 15, 20],
    'circle-color': HALO_COLOR,
    'circle-opacity': 0.2,
    'circle-stroke-color': HALO_COLOR,
    'circle-stroke-width': 2,
  },
}

export const VEHICLE_POINT_LAYER: LayerProps = {
  id: VEHICLE_LAYER_ID,
  type: 'circle',
  layout: { 'circle-sort-key': ['case', isSelected, 1, 0] },
  paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 6, 15, 11],
    'circle-color': statusColor,
    'circle-stroke-color': MARKER_OUTLINE,
    'circle-stroke-width': 2,
  },
}

/** Direction-of-travel arrow inside the marker of every moving vehicle. */
export const HEADING_ARROW_LAYER: LayerProps = {
  id: 'vehicle-heading',
  type: 'symbol',
  filter: ['==', ['get', 'status'], 'moving'],
  layout: {
    'icon-image': ARROW_IMAGE_ID,
    'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.45, 15, 0.8],
    'icon-rotate': ['get', 'heading'],
    'icon-rotation-alignment': 'map',
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
  },
  paint: { 'icon-color': MARKER_OUTLINE },
}

/** Draws the arrow once as an SDF image, so the layer can colour it. */
export const addArrowImage = (map: MapInstance) => {
  if (map.hasImage(ARROW_IMAGE_ID)) return
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return
  context.fillStyle = '#000'
  context.beginPath()
  context.moveTo(size / 2, 4)
  context.lineTo(size - 7, size - 6)
  context.lineTo(size / 2, size - 12)
  context.lineTo(7, size - 6)
  context.closePath()
  context.fill()
  map.addImage(ARROW_IMAGE_ID, context.getImageData(0, 0, size, size), {
    sdf: true,
    pixelRatio: 2,
  })
}
