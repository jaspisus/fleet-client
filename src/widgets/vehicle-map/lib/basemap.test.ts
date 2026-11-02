import type { LayerSpecification } from 'maplibre-gl'
import type { MapInstance } from 'react-map-gl/maplibre'
import { describe, expect, it, vi } from 'vitest'
import { recolorBasemap } from './basemap'

const layer = (id: string, type: string, sourceLayer?: string) =>
  ({
    id,
    type,
    source: 'openmaptiles',
    ...(sourceLayer && { 'source-layer': sourceLayer }),
  }) as LayerSpecification

const recolor = (layers: LayerSpecification[]) => {
  const setPaintProperty = vi.fn()
  const map = { getStyle: () => ({ layers }), setPaintProperty } as unknown as MapInstance
  recolorBasemap(map)
  return (id: string) =>
    Object.fromEntries(
      setPaintProperty.mock.calls
        .filter(([layerId]) => layerId === id)
        .map(([, property, value]) => [property, value]),
    )
}

describe('recolorBasemap', () => {
  it('paints the background and water in the app palette', () => {
    const paintOf = recolor([layer('background', 'background'), layer('water', 'fill', 'water')])

    expect(paintOf('background')).toEqual({ 'background-color': '#061720' })
    expect(paintOf('water')).toEqual({ 'fill-color': '#020c12' })
  })

  it('tells road classes apart by their layer id, the first matching rule winning', () => {
    const paintOf = recolor([
      layer('road_motorway_casing', 'line', 'transportation'),
      layer('road_motorway', 'line', 'transportation'),
      layer('road_major', 'line', 'transportation'),
      layer('road_path_dashline', 'line', 'transportation'),
      layer('road_minor', 'line', 'transportation'),
    ])

    expect(paintOf('road_motorway_casing')).toEqual({ 'line-color': '#0a2029' })
    expect(paintOf('road_motorway')).toEqual({ 'line-color': '#4f2c25' })
    expect(paintOf('road_major')).toEqual({ 'line-color': '#1a434d' })
    expect(paintOf('road_path_dashline')).toEqual({ 'line-color': '#061720' })
    expect(paintOf('road_minor')).toEqual({ 'line-color': '#0f2d37' })
  })

  it('outlines buildings and tells parks apart from other land use', () => {
    const paintOf = recolor([
      layer('building', 'fill', 'building'),
      layer('landuse_park', 'fill', 'landuse'),
      layer('landuse_residential', 'fill', 'landuse'),
    ])

    expect(paintOf('building')).toEqual({
      'fill-color': '#0b222b',
      'fill-outline-color': '#10303a',
    })
    expect(paintOf('landuse_park')).toEqual({ 'fill-color': '#0a2329' })
    expect(paintOf('landuse_residential')).toEqual({ 'fill-color': '#081c25' })
  })

  it('recolors place, road and water labels with a background halo', () => {
    const paintOf = recolor([
      layer('place_city', 'symbol', 'place'),
      layer('road_label', 'symbol', 'transportation_name'),
    ])

    expect(paintOf('place_city')).toEqual({ 'text-color': '#7a9398', 'text-halo-color': '#061720' })
    expect(paintOf('road_label')).toEqual({ 'text-color': '#58747a', 'text-halo-color': '#061720' })
  })

  it('leaves unknown layers and layers without a source layer as they are', () => {
    const paintOf = recolor([
      layer('poi_label', 'symbol', 'poi'),
      layer('peaks', 'line', 'mountain_peak'),
      layer('hillshade', 'hillshade', 'hillshade'),
      layer('satellite', 'raster'),
    ])

    for (const id of ['poi_label', 'peaks', 'hillshade', 'satellite']) {
      expect(paintOf(id)).toEqual({})
    }
  })
})
