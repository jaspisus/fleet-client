import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  dictionaries,
  jsonResponse,
  pendingResponse,
  problemResponse,
  sprinter01,
  stubApi,
} from '@/shared/test'
import { renderApp } from '../test/renderApp'
import { parseVehiclesSearch } from './routes'

describe('parseVehiclesSearch', () => {
  it('keeps text search and sort, dropping anything else', () => {
    expect(parseVehiclesSearch({ q: 'van', sort: '-name', page: 2 })).toEqual({
      q: 'van',
      sort: '-name',
    })
  })

  it('accepts numbers (search params are parsed as JSON) and drops empty values', () => {
    expect(parseVehiclesSearch({ q: 2021, sort: '' })).toEqual({ q: '2021', sort: undefined })
  })
})

describe('app routes', () => {
  it('redirects / to the vehicle table', async () => {
    stubApi()
    const { router } = renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Pojazdy', level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/vehicles')
    expect(document.title).toBe('Pojazdy · Panel floty')
  })

  it('shows a not-found page for unknown URLs', async () => {
    stubApi()
    renderApp('/nowhere')

    expect(
      await screen.findByRole('heading', { name: 'Nie znaleziono strony' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Przejdź do listy pojazdów' })).toHaveAttribute(
      'href',
      '/vehicles',
    )
  })

  it('restores search and sort from the URL and writes changes back', async () => {
    stubApi()
    const { user, router } = renderApp('/vehicles?q=sprinter&sort=-name')

    expect(await screen.findByText('2 pojazdy')).toBeInTheDocument()
    const names = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0]?.textContent)
    expect(names).toEqual(['Sprinter 02', 'Sprinter 01'])

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'transit')

    await waitFor(() =>
      expect(router.state.location.search).toEqual({ q: 'transit', sort: '-name' }),
    )
  })
})

describe('edit vehicle dialog', () => {
  it('opens over the table and closes back to it, keeping the search', async () => {
    stubApi()
    const { user, router } = renderApp('/vehicles?q=sprinter')

    await user.click(await screen.findByRole('link', { name: 'Edytuj pojazd Sprinter 01' }))

    const dialog = await screen.findByRole('dialog', { name: 'Edycja pojazdu: Sprinter 01' })
    expect(await within(dialog).findByLabelText('Nazwa')).toHaveValue('Sprinter 01')
    expect(screen.getByRole('table', { hidden: true })).toBeInTheDocument()
    expect(document.title).toBe('Edycja pojazdu: Sprinter 01 · Panel floty')

    await user.click(within(dialog).getByRole('button', { name: 'Anuluj' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(router.state.location.href).toBe('/vehicles?q=sprinter')
    expect(document.title).toBe('Pojazdy · Panel floty')
  })

  it('closes on Esc', async () => {
    stubApi()
    const { router } = renderApp(`/vehicles/${sprinter01.id}/edit`)

    const dialog = await screen.findByRole('dialog')
    fireEvent(dialog, new Event('cancel', { cancelable: true }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/vehicles'))
  })

  it('saves, closes and shows the change in the table', async () => {
    const saved = { ...sprinter01, name: 'Sprinter 01 – chłodnia' }
    stubApi({ [`PUT /api/vehicles/${sprinter01.id}`]: () => jsonResponse(saved) })
    const { user, router } = renderApp(`/vehicles/${sprinter01.id}/edit`)

    const name = await within(await screen.findByRole('dialog')).findByLabelText('Nazwa')
    await user.clear(name)
    await user.type(name, saved.name)
    await user.click(screen.getByRole('button', { name: 'Zapisz' }))

    expect(
      await screen.findByText('Zapisano zmiany pojazdu „Sprinter 01 – chłodnia”.'),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/vehicles')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Sprinter 01 – chłodnia' })).toBeInTheDocument()
  })

  it('cannot be closed while saving', async () => {
    stubApi({ [`PUT /api/vehicles/${sprinter01.id}`]: pendingResponse })
    const { user } = renderApp(`/vehicles/${sprinter01.id}/edit`)

    const dialog = await screen.findByRole('dialog')
    await user.type(await within(dialog).findByLabelText('Nazwa'), ' X')
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }))

    expect(await within(dialog).findByRole('button', { name: 'Zamknij' })).toBeDisabled()
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('explains an unknown vehicle', async () => {
    stubApi()
    renderApp('/vehicles/vehicle-unknown/edit')

    expect(
      await within(await screen.findByRole('dialog')).findByText(
        'Nie znaleziono pojazdu. Mógł zostać usunięty.',
      ),
    ).toBeInTheDocument()
  })

  it('offers a retry when the form data cannot be loaded', async () => {
    const api = stubApi({ 'GET /api/dictionaries': () => problemResponse(500) })
    const { user } = renderApp(`/vehicles/${sprinter01.id}/edit`)

    const dialog = await screen.findByRole('dialog')
    expect(
      await within(dialog).findByText('Nie udało się wczytać danych pojazdu.'),
    ).toBeInTheDocument()

    api.routes['GET /api/dictionaries'] = () => jsonResponse(dictionaries)
    await user.click(within(dialog).getByRole('button', { name: 'Spróbuj ponownie' }))

    expect(await within(dialog).findByLabelText('Marka')).toBeInTheDocument()
  })
})

describe('language', () => {
  it('switches the whole UI to English and back', async () => {
    stubApi()
    const { user } = renderApp('/vehicles')

    await user.click(await screen.findByRole('combobox', { name: 'Język interfejsu' }))
    await user.click(screen.getByRole('option', { name: 'English' }))

    expect(await screen.findByRole('heading', { name: 'Vehicles', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('4 vehicles')).toBeInTheDocument()
    expect(screen.getAllByText('Van').length).toBeGreaterThan(0)
    expect(document.title).toBe('Vehicles · Fleet Panel')

    await user.click(screen.getByRole('combobox', { name: 'Interface language' }))
    await user.click(screen.getByRole('option', { name: 'Polski' }))
    expect(await screen.findByRole('heading', { name: 'Pojazdy', level: 1 })).toBeInTheDocument()
  })
})
