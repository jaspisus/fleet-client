import { screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useSelectionStore } from '@/features/select-vehicle'
import {
  eTransit,
  jsonResponse,
  pendingResponse,
  problemResponse,
  renderWithProviders,
  sprinter01,
  stubApi,
} from '@/shared/test'
import type { VehicleSort } from '../model/columns'
import { VehiclesTable } from './VehiclesTable'

interface HarnessProps {
  initialQuery?: string
  onSortChange?: (sort: VehicleSort | undefined) => void
}

const Harness = ({ initialQuery = '', onSortChange }: HarnessProps) => {
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState<VehicleSort>()
  return (
    <VehiclesTable
      query={query}
      sort={sort}
      onQueryChange={setQuery}
      onSortChange={(next) => {
        setSort(next)
        onSortChange?.(next)
      }}
    />
  )
}

const vehicleNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent)

describe('VehiclesTable', () => {
  it('shows a loading state', async () => {
    stubApi({ 'GET /api/vehicles': pendingResponse })
    renderWithProviders(<Harness />)

    expect(await screen.findByRole('status')).toHaveTextContent('Ładowanie…')
  })

  it('lists every vehicle with translated values', async () => {
    stubApi()
    renderWithProviders(<Harness />)

    expect(await screen.findByText('4 pojazdy')).toBeInTheDocument()
    expect(vehicleNames()).toEqual(['Sprinter 01', 'Sprinter 02', 'e-Transit Sopot', 'Transit 05'])
    const row = screen.getByRole('row', { name: /e-Transit Sopot/ })
    expect(within(row).getByText('Mała ciężarówka')).toBeInTheDocument()
    expect(within(row).getByText('Elektryczny')).toBeInTheDocument()
    expect(within(row).getByText('Ford E-Transit')).toBeInTheDocument()
    expect(
      within(screen.getByRole('row', { name: /Transit 05/ })).getByText('Brak kierowcy'),
    ).toBeInTheDocument()
  })

  it('searches ignoring case, spaces and Polish characters', async () => {
    stubApi()
    const { user } = renderWithProviders(<Harness />)
    const search = await screen.findByRole('searchbox', { name: 'Szukaj pojazdów' })

    await user.type(search, 'wisniewska')
    expect(vehicleNames()).toEqual(['e-Transit Sopot'])
    expect(screen.getByText('1 pojazd')).toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'ga4k')
    expect(vehicleNames()).toEqual(['Sprinter 01'])
  })

  it('says when nothing matches', async () => {
    stubApi()
    const { user } = renderWithProviders(<Harness />)

    await user.type(await screen.findByRole('searchbox'), 'tir')

    expect(screen.getByText('Brak pojazdów pasujących do „tir”.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('sorts by a column, ascending then descending', async () => {
    stubApi()
    const onSortChange = vi.fn()
    const { user } = renderWithProviders(<Harness onSortChange={onSortChange} />)
    const yearHeader = await screen.findByRole('columnheader', { name: /Rok/ })

    await user.click(within(yearHeader).getByRole('button'))
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'yearOfManufacture', desc: false })
    expect(yearHeader).toHaveAttribute('aria-sort', 'ascending')
    expect(vehicleNames()).toEqual(['Transit 05', 'Sprinter 01', 'Sprinter 02', 'e-Transit Sopot'])

    await user.click(within(yearHeader).getByRole('button'))
    expect(yearHeader).toHaveAttribute('aria-sort', 'descending')
    expect(vehicleNames()[0]).toBe('e-Transit Sopot')
  })

  it('does not offer sorting by the actions column', async () => {
    stubApi()
    renderWithProviders(<Harness />)

    const actionsHeader = await screen.findByRole('columnheader', { name: 'Akcje' })

    expect(within(actionsHeader).queryByRole('button')).not.toBeInTheDocument()
  })

  it('links to the edit dialog, keeping the search', async () => {
    stubApi()
    renderWithProviders(<Harness initialQuery="sprinter" />, { path: '/vehicles?q=sprinter' })

    const edit = await screen.findByRole('link', { name: 'Edytuj pojazd Sprinter 01' })

    expect(edit).toHaveAttribute('href', `/vehicles/${sprinter01.id}/edit?q=sprinter`)
  })

  it('shows a vehicle on the map', async () => {
    stubApi()
    const { user, router } = renderWithProviders(<Harness />, { path: '/vehicles' })

    await user.click(
      await screen.findByRole('button', { name: 'Pokaż pojazd e-Transit Sopot na mapie' }),
    )

    expect(useSelectionStore.getState().selectedVehicleId).toBe(eTransit.id)
    expect(router.state.location.pathname).toBe('/map')
  })

  it('explains a failed load and retries', async () => {
    const api = stubApi({ 'GET /api/vehicles': () => problemResponse(503) })
    const { user } = renderWithProviders(<Harness />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Nie udało się wczytać listy pojazdów.')
    expect(alert).toHaveTextContent('Serwer zwrócił błąd (503).')

    api.routes['GET /api/vehicles'] = () => jsonResponse({ items: [sprinter01], total: 1 })
    await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }))

    expect(await screen.findByText('1 pojazd')).toBeInTheDocument()
  })
})
