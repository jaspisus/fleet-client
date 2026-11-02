import type { LayerSpecification } from 'maplibre-gl'
import type { MapInstance } from 'react-map-gl/maplibre'

const BASEMAP_COLORS = {
  land: '#061720',
  residential: '#081c25',
  green: '#0a2329',
  water: '#020c12',
  building: '#0b222b',
  buildingOutline: '#10303a',
  roadMinor: '#0f2d37',
  roadMajor: '#1a434d',
  roadCasing: '#0a2029',
  motorway: '#4f2c25',
  railway: '#14343e',
  boundary: '#27565d',
  label: '#7a9398',
  labelMinor: '#58747a',
  labelHalo: '#061720',
}

interface ShapeRule {
  sourceLayer: string
  idIncludes?: string
  color: string
}

const SHAPE_RULES: readonly ShapeRule[] = [
  { sourceLayer: 'water', color: BASEMAP_COLORS.water },
  { sourceLayer: 'waterway', color: BASEMAP_COLORS.water },
  { sourceLayer: 'landcover', color: BASEMAP_COLORS.green },
  { sourceLayer: 'landuse', idIncludes: 'park', color: BASEMAP_COLORS.green },
  { sourceLayer: 'landuse', color: BASEMAP_COLORS.residential },
  { sourceLayer: 'park', color: BASEMAP_COLORS.green },
  { sourceLayer: 'building', color: BASEMAP_COLORS.building },
  { sourceLayer: 'aeroway', color: BASEMAP_COLORS.roadMinor },
  { sourceLayer: 'transportation', idIncludes: 'dashline', color: BASEMAP_COLORS.land },
  { sourceLayer: 'transportation', idIncludes: 'casing', color: BASEMAP_COLORS.roadCasing },
  { sourceLayer: 'transportation', idIncludes: 'motorway', color: BASEMAP_COLORS.motorway },
  { sourceLayer: 'transportation', idIncludes: 'major', color: BASEMAP_COLORS.roadMajor },
  { sourceLayer: 'transportation', idIncludes: 'railway', color: BASEMAP_COLORS.railway },
  { sourceLayer: 'transportation', color: BASEMAP_COLORS.roadMinor },
  { sourceLayer: 'boundary', color: BASEMAP_COLORS.boundary },
]

const LABEL_COLORS: Readonly<Record<string, string>> = {
  place: BASEMAP_COLORS.label,
  transportation_name: BASEMAP_COLORS.labelMinor,
  water_name: BASEMAP_COLORS.labelMinor,
}

const COLOR_PROPERTIES: Partial<Record<LayerSpecification['type'], 'fill-color' | 'line-color'>> = {
  fill: 'fill-color',
  line: 'line-color',
}

const getSourceLayer = (layer: LayerSpecification) =>
  'source-layer' in layer ? layer['source-layer'] : undefined

const findShapeColor = (layer: LayerSpecification, sourceLayer: string) =>
  SHAPE_RULES.find(
    (rule) =>
      rule.sourceLayer === sourceLayer &&
      (rule.idIncludes === undefined || layer.id.includes(rule.idIncludes)),
  )?.color

/**
 * Repaints the OpenMapTiles-schema basemap in the app palette. Layers are matched by
 * `source-layer` (and id fragments for road classes), so unknown layers keep their style.
 */
export const recolorBasemap = (map: MapInstance) => {
  for (const layer of map.getStyle().layers) {
    if (layer.type === 'background') {
      map.setPaintProperty(layer.id, 'background-color', BASEMAP_COLORS.land)
      continue
    }
    const sourceLayer = getSourceLayer(layer)
    if (!sourceLayer) continue

    if (layer.type === 'symbol') {
      const labelColor = LABEL_COLORS[sourceLayer]
      if (!labelColor) continue
      map.setPaintProperty(layer.id, 'text-color', labelColor)
      map.setPaintProperty(layer.id, 'text-halo-color', BASEMAP_COLORS.labelHalo)
      continue
    }

    const colorProperty = COLOR_PROPERTIES[layer.type]
    const color = findShapeColor(layer, sourceLayer)
    if (!colorProperty || !color) continue
    map.setPaintProperty(layer.id, colorProperty, color)
    if (sourceLayer === 'building') {
      map.setPaintProperty(layer.id, 'fill-outline-color', BASEMAP_COLORS.buildingOutline)
    }
  }
}
