import { act, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Vehicle } from '@/entities/vehicle'
import { useSelectionStore } from '@/features/select-vehicle'
import {
  fakeConnections,
  position,
  problemResponse,
  renderWithProviders,
  sprinter01,
  sprinter02,
  stubApi,
  type FakeHubConnection,
} from '@/shared/test'
import { LiveMapPage } from './LiveMapPage'

vi.mock('@microsoft/signalr', async () => (await import('@/shared/test')).fakeSignalRModule())

interface FakeMapProps {
  vehicles: readonly Vehicle[]
  selectedVehicleId: string | null
  onSelect: (vehicleId: string | null) => void
}

// The real map needs WebGL; this stand-in shows the selection and lets tests "click" vehicles.
vi.mock('@/widgets/vehicle-map', () => ({
  VehicleMap: ({ vehicles, selectedVehicleId, onSelect }: FakeMapProps) => (
    <div role="region" aria-label="map">
      {vehicles.map((vehicle) => (
        <button
          key={vehicle.id}
          type="button"
          aria-pressed={vehicle.id === selectedVehicleId}
          onClick={() => onSelect(vehicle.id)}
        >
          {`marker ${vehicle.name}`}
        </button>
      ))}
    </div>
  ),
}))

const connection = () => fakeConnections.at(-1) as FakeHubConnection
const listItem = (name: string) =>
  within(screen.getByRole('list', { name: 'Pojazdy' })).getByRole('button', {
    name: new RegExp(`^\\p{L}[\\p{L} ]*?${name}`, 'u'),
  })
const marker = (name: string) =>
  within(screen.getByRole('region', { name: 'map' })).getByRole('button', {
    name: `marker ${name}`,
  })

describe('LiveMapPage', () => {
  beforeEach(() => {
    fakeConnections.length = 0
  })

  it('follows every vehicle live and shows the positions in the list', async () => {
    stubApi()
    renderWithProviders(<LiveMapPage />)
    await screen.findByRole('list', { name: 'Pojazdy' })

    await vi.waitFor(() => expect(connection().invoke).toHaveBeenCalled())
    expect(connection().invoke).toHaveBeenCalledWith(
      'SubscribeLiveTrack',
      expect.arrayContaining([sprinter01.id, sprinter02.id]),
    )
    expect(await screen.findByText('Połączenie: Na żywo')).toBeInTheDocument()

    act(() =>
      connection().emit('LiveTrack', [
        position(sprinter01.id, { speed: 37, lastReportedTime: new Date().toISOString() }),
      ]),
    )

    expect(listItem('Sprinter 01')).toHaveTextContent('W ruchu')
    expect(listItem('Sprinter 01')).toHaveTextContent('37 km/godz.')
  })

  it('keeps the list and the map selection in sync', async () => {
    stubApi()
    const { user } = renderWithProviders(<LiveMapPage />)
    await screen.findByRole('list', { name: 'Pojazdy' })

    await user.click(listItem('Sprinter 02'))
    expect(marker('Sprinter 02')).toHaveAttribute('aria-pressed', 'true')

    await user.click(marker('Sprinter 01'))
    expect(listItem('Sprinter 01')).toHaveAttribute('aria-pressed', 'true')
    expect(listItem('Sprinter 02')).toHaveAttribute('aria-pressed', 'false')
    expect(useSelectionStore.getState().selectedVehicleId).toBe(sprinter01.id)
  })

  it('offers a reconnect after the connection is lost', async () => {
    stubApi()
    const { user } = renderWithProviders(<LiveMapPage />)
    await vi.waitFor(() => expect(connection().invoke).toHaveBeenCalled())

    act(() => connection().simulateClose())
    expect(await screen.findByText('Połączenie: Rozłączono')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }))

    expect(await screen.findByText('Połączenie: Na żywo')).toBeInTheDocument()
    expect(fakeConnections).toHaveLength(2)
  })

  it('explains a failed vehicle load', async () => {
    stubApi({ 'GET /api/vehicles': () => problemResponse(500) })
    renderWithProviders(<LiveMapPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nie udało się wczytać listy pojazdów.',
    )
  })
})
