import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { vehicleKeys } from '@/entities/vehicle'
import { useToastStore } from '@/shared/ui'
import {
  dictionaries,
  drivers,
  fleets,
  jsonResponse,
  pendingResponse,
  problemResponse,
  renderWithQuery,
  sprinter01,
  stubApi,
  vehicles,
} from '@/shared/test'
import { EditVehicleForm } from './EditVehicleForm'

const PUT = `PUT /api/vehicles/${sprinter01.id}`

const renderForm = () => {
  const onSaved = vi.fn()
  const onCancel = vi.fn()
  const view = renderWithQuery(
    <EditVehicleForm
      vehicle={sprinter01}
      vehicles={vehicles}
      dictionaries={dictionaries}
      fleets={fleets}
      drivers={drivers}
      onSaved={onSaved}
      onCancel={onCancel}
    />,
  )
  view.queryClient.setQueryData(vehicleKeys.list(), { items: vehicles, total: vehicles.length })
  return { ...view, onSaved, onCancel }
}

const field = (label: string) => screen.getByLabelText(label)
const saveButton = () => screen.getByRole('button', { name: 'Zapisz' })

describe('EditVehicleForm', () => {
  it('starts with the vehicle values and Save disabled', () => {
    renderForm()

    expect(field('Nazwa')).toHaveValue('Sprinter 01')
    expect(field('Numer rejestracyjny')).toHaveValue('GA 4K215')
    expect(field('Marka')).toHaveDisplayValue('Mercedes-Benz')
    expect(field('Model')).toHaveDisplayValue('Sprinter')
    expect(field('Rok produkcji')).toHaveValue('2021')
    expect(field('Typ pojazdu')).toHaveDisplayValue('Furgon')
    expect(field('Rodzaj paliwa')).toHaveDisplayValue('Diesel')
    expect(field('Flota')).toHaveDisplayValue('Dostawy Gdynia')
    expect(field('Kierowca')).toHaveDisplayValue('Anna Nowak')
    expect(saveButton()).toBeDisabled()
  })

  it('lists drivers by surname, with "no driver" first', () => {
    renderForm()

    expect(
      within(field('Kierowca'))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Brak kierowcy', 'Piotr Kowalski', 'Anna Nowak', 'Katarzyna Wiśniewska'])
  })

  it('validates on save, then again as the user types', async () => {
    const { requests } = stubApi()
    const { user } = renderForm()

    await user.clear(field('Nazwa'))
    await user.tab()
    expect(screen.queryByText('Nazwa jest wymagana.')).not.toBeInTheDocument()

    await user.click(saveButton())
    expect(await screen.findByText('Nazwa jest wymagana.')).toBeInTheDocument()
    expect(field('Nazwa')).toHaveAttribute('aria-invalid', 'true')
    expect(field('Nazwa')).toHaveAccessibleDescription('Nazwa jest wymagana.')

    await user.type(field('Nazwa'), 'A')
    expect(screen.getByText('Nazwa musi mieć od 2 do 60 znaków.')).toBeInTheDocument()
    await user.type(field('Nazwa'), 'B')
    expect(screen.queryByText('Nazwa musi mieć od 2 do 60 znaków.')).not.toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('catches a plate used by another vehicle before saving', async () => {
    const { requests } = stubApi()
    const { user } = renderForm()

    await user.clear(field('Numer rejestracyjny'))
    await user.type(field('Numer rejestracyjny'), 'ga 7m302')
    await user.click(saveButton())

    expect(
      await screen.findByText('Ten numer rejestracyjny ma już inny pojazd.'),
    ).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('offers only models of the chosen make and clears a model of another make', async () => {
    const { user } = renderForm()

    await user.selectOptions(field('Marka'), 'Ford')

    expect(field('Model')).toHaveValue('')
    expect(
      within(field('Model'))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Wybierz…', 'E-Transit', 'Transit'])
    await user.click(saveButton())
    expect(await screen.findByText('Wybierz model.')).toBeInTheDocument()
  })

  it('sends every field and reports the saved vehicle', async () => {
    const saved = { ...sprinter01, name: 'Sprinter 01 – chłodnia', driver: null }
    const { requests } = stubApi({ [PUT]: () => jsonResponse(saved) })
    const { user, onSaved, queryClient } = renderForm()

    await user.clear(field('Nazwa'))
    await user.type(field('Nazwa'), '  Sprinter 01 – chłodnia ')
    await user.selectOptions(field('Kierowca'), 'Brak kierowcy')
    await user.click(saveButton())

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved))
    expect(requests).toEqual([
      {
        method: 'PUT',
        path: `/api/vehicles/${sprinter01.id}`,
        body: {
          name: 'Sprinter 01 – chłodnia',
          registrationNumber: 'GA 4K215',
          manufacturerId: 'make-mercedes',
          modelId: 'model-sprinter',
          yearOfManufacture: 2021,
          type: 'Van',
          fuelType: 'Diesel',
          fleetId: 'fleet-gdynia',
          driverId: null,
        },
      },
    ])
    expect(queryClient.getQueryData(vehicleKeys.detail(sprinter01.id))).toEqual(saved)
    expect(useToastStore.getState().toasts.map((toast) => toast.message)).toEqual([
      'Zapisano zmiany pojazdu „Sprinter 01 – chłodnia”.',
    ])
  })

  it('locks the form while saving', async () => {
    stubApi({ [PUT]: pendingResponse })
    const { user } = renderForm()

    await user.type(field('Nazwa'), ' X')
    await user.click(saveButton())

    expect(await screen.findByRole('button', { name: 'Zapisywanie…' })).toBeDisabled()
    expect(field('Nazwa')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anuluj' })).toBeDisabled()
  })

  it('shows server validation errors, translated, on their fields', async () => {
    stubApi({
      [PUT]: () =>
        problemResponse(400, {
          errors: {
            registrationNumber: ['Registration number is already used by another vehicle.'],
            modelId: ['Model does not belong to the selected manufacturer.'],
          },
        }),
    })
    const { user, onSaved } = renderForm()

    await user.type(field('Nazwa'), ' X')
    await user.click(saveButton())

    expect(
      await screen.findByText('Ten numer rejestracyjny ma już inny pojazd.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Model nie należy do wybranej marki.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Popraw zaznaczone pola')
    expect(onSaved).not.toHaveBeenCalled()

    // Editing the field makes its server error outdated.
    await user.type(field('Numer rejestracyjny'), '1')
    expect(
      screen.queryByText('Ten numer rejestracyjny ma już inny pojazd.'),
    ).not.toBeInTheDocument()
  })

  it('keeps the values after a failed save, so the user can retry', async () => {
    const api = stubApi({ [PUT]: () => problemResponse(500, { detail: 'Nothing was saved.' }) })
    const { user, onSaved } = renderForm()

    await user.clear(field('Nazwa'))
    await user.type(field('Nazwa'), 'Sprinter A')
    await user.click(saveButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('Nie udało się zapisać zmian')
    expect(field('Nazwa')).toHaveValue('Sprinter A')

    api.routes[PUT] = () => jsonResponse({ ...sprinter01, name: 'Sprinter A' })
    await user.click(saveButton())

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('explains a vehicle that disappeared', async () => {
    stubApi({ [PUT]: () => problemResponse(404) })
    const { user } = renderForm()

    await user.type(field('Nazwa'), ' X')
    await user.click(saveButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('Ten pojazd już nie istnieje')
  })

  it('cancels without saving', async () => {
    const { requests } = stubApi()
    const { user, onCancel } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Anuluj' }))

    expect(onCancel).toHaveBeenCalled()
    expect(requests).toHaveLength(0)
  })
})
