import { expect, test } from './support/test'

test.describe('visual regression', () => {
  test('vehicle table', async ({ page }) => {
    await page.goto('/vehicles')
    await expect(page.getByText('5 pojazdów')).toBeVisible()

    await expect(page).toHaveScreenshot('vehicles.png', { fullPage: true })
  })

  test('vehicle table without search results', async ({ page }) => {
    await page.goto('/vehicles?q=autobus')
    await expect(page.getByText('Brak pojazdów pasujących')).toBeVisible()

    await expect(page).toHaveScreenshot('vehicles-no-results.png')
  })

  test('vehicle table load error', async ({ page, api }) => {
    api.override('GET /api/vehicles', () => ({
      status: 503,
      body: { title: 'Service Unavailable', status: 503 },
    }))
    await page.goto('/vehicles')
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 })

    await expect(page).toHaveScreenshot('vehicles-error.png')
  })

  test('edit dialog', async ({ page }) => {
    await page.goto('/vehicles/vehicle-sprinter-01/edit')
    await expect(page.getByRole('dialog').getByLabel('Nazwa')).toHaveValue('Sprinter 01')

    await expect(page).toHaveScreenshot('edit-dialog.png')
  })

  test('edit dialog with validation errors', async ({ page }) => {
    await page.goto('/vehicles/vehicle-sprinter-01/edit')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nazwa').fill('S')
    await dialog.getByLabel('Numer rejestracyjny').fill('ga 7m302')
    await dialog.getByLabel('Marka').selectOption({ label: 'Ford' })
    await dialog.getByRole('button', { name: 'Zapisz' }).click()
    await expect(dialog.getByText('Wybierz model.')).toBeVisible()

    await expect(page).toHaveScreenshot('edit-dialog-errors.png')
  })

  test('live map with a selected vehicle', async ({ page }) => {
    await page.goto('/map')
    const list = page.getByRole('list', { name: 'Pojazdy' })
    await expect(list.getByRole('button', { name: /^Sprinter 01/ })).toContainText('W ruchu')
    await list.getByRole('button', { name: /^Sprinter 01/ }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Połączenie' })).toContainText(
      'Na żywo',
    )
    await page.waitForTimeout(1_000)

    await expect(page).toHaveScreenshot('live-map.png')
  })

  test('vehicle table in English', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'visual-1440', 'One English check is enough')
    await page.goto('/vehicles')
    await page.getByRole('combobox', { name: 'Język interfejsu' }).click()
    await page.getByRole('option', { name: 'English' }).click()
    await expect(page.getByText('5 vehicles')).toBeVisible()

    await expect(page).toHaveScreenshot('vehicles-en.png', { fullPage: true })
  })
})
