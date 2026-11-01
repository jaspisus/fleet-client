import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { position, sprinter01, sprinter02 } from '@/shared/test'
import { VehicleMap } from './VehicleMap'

interface FakeMapProps {
  children: ReactNode
  onClick: (event: { features: Array<{ properties: Record<string, unknown> }> }) => void
}

// MapLibre needs WebGL, so the map is replaced by buttons that fire the same click events.
vi.mock('react-map-gl/maplibre', () => ({
  default: ({ children, onClick }: FakeMapProps) => (
    <div>
      {children}
      <button
        type="button"
        onClick={() =>
          onClick({ features: [{ properties: { vehicleId: 'vehicle-sprinter-02' } }] })
        }
      >
        marker
      </button>
      <button type="button" onClick={() => onClick({ features: [] })}>
        empty map
      </button>
    </div>
  ),
  Source: ({ children }: { children: ReactNode }) => children,
  Layer: () => null,
  NavigationControl: () => null,
}))
vi.mock('../lib/maplibre', () => ({ maplibre: {} }))

describe('VehicleMap', () => {
  const renderMap = () => {
    const onSelect = vi.fn()
    render(
      <VehicleMap
        vehicles={[sprinter01, sprinter02]}
        positions={{ [sprinter02.id]: position(sprinter02.id) }}
        selectedVehicleId={sprinter01.id}
        now={Date.now()}
        onSelect={onSelect}
      />,
    )
    return onSelect
  }

  it('is a labelled region', () => {
    renderMap()
    expect(screen.getByRole('region', { name: 'Mapa pozycji pojazdów' })).toBeInTheDocument()
  })

  it('selects the clicked vehicle and clears the selection on the empty map', async () => {
    const onSelect = renderMap()

    await userEvent.click(screen.getByRole('button', { name: 'marker' }))
    expect(onSelect).toHaveBeenLastCalledWith(sprinter02.id)

    await userEvent.click(screen.getByRole('button', { name: 'empty map' }))
    expect(onSelect).toHaveBeenLastCalledWith(null)
  })
})
