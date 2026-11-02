import { expect, test } from './support/test'

const EDIT_SPRINTER = '/vehicles/vehicle-sprinter-01/edit'

test.describe('edit vehicle', () => {
  test('edits a vehicle in a dialog over the table', async ({ page, api }) => {
    await page.goto('/vehicles?q=sprinter')
    const editLink = page.getByRole('link', { name: 'Edytuj pojazd Sprinter 01' })
    await editLink.click()

    const dialog = page.getByRole('dialog', { name: 'Sprinter 01' })
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(`${EDIT_SPRINTER}?q=sprinter`)

    await dialog.getByLabel('Nazwa').fill('Sprinter 01 – chłodnia')
    await dialog.getByLabel('Marka').selectOption({ label: 'Ford' })
    await dialog.getByLabel('Model').selectOption({ label: 'E-Transit' })
    await dialog.getByLabel('Rodzaj paliwa').selectOption({ label: 'Elektryczny' })
    await dialog.getByLabel('Kierowca').selectOption({ label: 'Brak kierowcy' })
    await dialog.getByRole('button', { name: 'Zapisz' }).click()

    await expect(page.getByText('Zapisano zmiany pojazdu „Sprinter 01 – chłodnia”.')).toBeVisible()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL('/vehicles?q=sprinter')
    const row = page.getByRole('row', { name: /Sprinter 01 – chłodnia/ })
    await expect(row).toContainText('Ford E-Transit')
    await expect(row).toContainText('Brak kierowcy')
    expect(api.requests.filter(({ method }) => method === 'PUT')).toEqual([
      {
        method: 'PUT',
        path: '/api/vehicles/vehicle-sprinter-01',
        body: {
          name: 'Sprinter 01 – chłodnia',
          registrationNumber: 'GA 4K215',
          manufacturerId: 'make-ford',
          modelId: 'model-etransit',
          yearOfManufacture: 2021,
          type: 'Van',
          fuelType: 'Electric',
          fleetId: 'fleet-gdynia',
          driverId: null,
        },
      },
    ])
  })

  test('is a real modal: focus stays inside, Esc closes it and focus returns', async ({ page }) => {
    await page.goto('/vehicles')
    const editLink = page.getByRole('link', { name: 'Edytuj pojazd Sprinter 02' })
    await editLink.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByLabel('Nazwa')).toBeVisible()

    for (let step = 0; step < 15; step++) await page.keyboard.press('Tab')
    await expect(dialog.locator(':focus')).toHaveCount(1)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL('/vehicles')
    await expect(editLink).toBeFocused()
  })

  test('does not reopen on Back after closing', async ({ page }) => {
    await page.goto('/vehicles')
    await page.getByRole('link', { name: 'Edytuj pojazd Sprinter 01' }).click()
    const dialog = page.getByRole('dialog', { name: 'Sprinter 01' })
    await dialog.getByRole('button', { name: 'Anuluj' }).click()
    await expect(dialog).toBeHidden()

    await page.goBack()

    await expect(page).toHaveURL('/vehicles')
    await expect(dialog).toBeHidden()
  })

  test('opens from a deep link', async ({ page }) => {
    await page.goto(EDIT_SPRINTER)

    await expect(page.getByRole('dialog', { name: 'Sprinter 01' })).toBeVisible()
    await expect(page.getByRole('table')).toBeAttached()
  })

  test('shows server validation errors on their fields', async ({ page, api }) => {
    api.override('PUT /api/vehicles/vehicle-sprinter-01', () => ({
      status: 400,
      body: {
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: {
          name: ['Name must be between 2 and 60 characters long.'],
          modelId: ['Model does not belong to the selected manufacturer.'],
        },
      },
    }))
    await page.goto(EDIT_SPRINTER)
    const dialog = page.getByRole('dialog')

    await dialog.getByLabel('Nazwa').fill('Sprinter X')
    await dialog.getByRole('button', { name: 'Zapisz' }).click()

    await expect(dialog.getByLabel('Nazwa')).toHaveAccessibleDescription(
      'Nazwa musi mieć od 2 do 60 znaków.',
    )
    await expect(dialog.getByLabel('Model')).toHaveAccessibleDescription(
      'Model nie należy do wybranej marki.',
    )
    await expect(dialog.getByRole('alert')).toHaveText('Popraw zaznaczone pola i spróbuj ponownie.')
  })

  test('keeps the edits after a failed save and saves on retry', async ({ page, api }) => {
    let failSave = true
    api.override('PUT /api/vehicles/vehicle-sprinter-01', ({ body }) =>
      failSave
        ? {
            status: 500,
            body: {
              title: 'An error occurred while processing your request.',
              status: 500,
              detail: 'Simulated failure (--save-error-rate). Nothing was saved.',
            },
          }
        : { body: { ...api.vehicles[0], ...(body as object), name: 'Sprinter A' } },
    )
    await page.goto(EDIT_SPRINTER)
    const dialog = page.getByRole('dialog')

    await dialog.getByLabel('Nazwa').fill('Sprinter A')
    await dialog.getByRole('button', { name: 'Zapisz' }).click()
    await expect(dialog.getByRole('alert')).toContainText('Nie udało się zapisać zmian')
    await expect(dialog.getByLabel('Nazwa')).toHaveValue('Sprinter A')

    failSave = false
    await dialog.getByRole('button', { name: 'Zapisz' }).click()
    await expect(page.getByText('Zapisano zmiany pojazdu „Sprinter A”.')).toBeVisible()
  })

  test('explains a vehicle that does not exist', async ({ page }) => {
    await page.goto('/vehicles/vehicle-unknown/edit')

    await expect(page.getByRole('dialog')).toContainText('Nie znaleziono pojazdu.')
  })
})
