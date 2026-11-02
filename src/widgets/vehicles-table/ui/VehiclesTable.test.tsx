import { act, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSelectionStore } from '@/features/select-vehicle'
import {
  eTransit,
  jsonResponse,
  pendingResponse,
  problemResponse,
  renderWithProviders,
  sprinter01,
  stubApi,
  stubReducedMotion,
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
  beforeEach(() => {
    stubReducedMotion()
  })

  it('shows a loading state without the search', async () => {
    stubApi({ 'GET /api/vehicles': pendingResponse })
    renderWithProviders(<Harness />)

    expect(await screen.findByRole('status')).toHaveTextContent('Ładowanie pojazdów…')
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    // The count's live region exists before the list loads, so its first text is announced.
    const count = screen.getByRole('heading', { level: 1, name: 'Pojazdy' }).nextElementSibling
    expect(count).toHaveAttribute('aria-live', 'polite')
    expect(count).toBeEmptyDOMElement()
  })

  it('lists every vehicle with translated values', async () => {
    stubApi()
    renderWithProviders(<Harness />)

    expect(await screen.findByText('4 pojazdy')).toBeInTheDocument()
    expect(vehicleNames()).toEqual(['Sprinter 01', 'Sprinter 02', 'e-Transit Sopot', 'Transit 05'])
    const row = screen.getByRole('row', { name: /e-Transit Sopot/ })
    expect(within(row).getByText('Mała ciężarówka')).toBeInTheDocument()
    expect(within(row).getAllByRole('cell')[0]).toHaveAccessibleName(
      /^Mała ciężarówka\s?e-Transit Sopot$/,
    )
    expect(within(row).getByText('Elektryczny')).toBeInTheDocument()
    expect(within(row).getByText('Ford E-Transit')).toBeInTheDocument()
    expect(
      within(screen.getByRole('row', { name: /Transit 05/ })).getByText('Brak kierowcy'),
    ).toBeInTheDocument()
  })

  it('puts the full text of API values that may be cut in a tooltip', async () => {
    stubApi()
    renderWithProviders(<Harness />)

    const row = await screen.findByRole('row', { name: /e-Transit Sopot/ })
    for (const text of [
      'e-Transit Sopot',
      'GSP 2E41',
      'Ford E-Transit',
      'Serwis Gdańsk',
      'Katarzyna Wiśniewska',
    ]) {
      expect(within(row).getByTitle(text)).toHaveTextContent(text)
    }
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

  it('sorts by one column only: shift+click replaces the sort', async () => {
    stubApi()
    const onSortChange = vi.fn()
    const { user } = renderWithProviders(<Harness onSortChange={onSortChange} />)
    const nameHeader = await screen.findByRole('columnheader', { name: /Nazwa/ })
    const yearHeader = screen.getByRole('columnheader', { name: /Rok/ })
    await user.click(within(nameHeader).getByRole('button'))

    await user.keyboard('{Shift>}')
    await user.click(within(yearHeader).getByRole('button'))
    await user.keyboard('{/Shift}')

    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'yearOfManufacture', desc: false })
    expect(nameHeader).not.toHaveAttribute('aria-sort')
    expect(yearHeader).toHaveAttribute('aria-sort', 'ascending')
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

  it('links each card to the vehicle details, keeping the search', async () => {
    stubApi()
    renderWithProviders(<Harness initialQuery="sprinter" />, { path: '/vehicles?q=sprinter' })

    const details = await screen.findByRole('link', { name: 'Szczegóły pojazdu Sprinter 01' })

    expect(details).toHaveAttribute('href', `/vehicles/${sprinter01.id}?q=sprinter`)
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

  it('keeps the loaded table when a background refresh fails', async () => {
    const api = stubApi()
    const { queryClient } = renderWithProviders(<Harness />)
    expect(await screen.findByText('4 pojazdy')).toBeInTheDocument()

    api.routes['GET /api/vehicles'] = () => problemResponse(503)
    await act(async () => {
      await queryClient.refetchQueries()
      // TanStack Query notifies observers on a timeout, so the failed state renders a tick later.
      await new Promise((resolve) => setTimeout(resolve))
    })

    expect(screen.getByText('4 pojazdy')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('VehiclesTable with motion', () => {
  it('keeps the loader after the data arrives, until the loader finishes', async () => {
    stubApi()
    const { queryClient } = renderWithProviders(<Harness />)

    await waitFor(() => expect(queryClient.isFetching()).toBe(0))

    expect(screen.getByRole('status')).toHaveTextContent('Ładowanie pojazdów…')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })
})
