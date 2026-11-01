import { expect, test } from './support/test'

const vehicleNames = (page: import('@playwright/test').Page) =>
  page
    .getByRole('row')
    .locator('[data-column="name"]')
    .filter({ hasNot: page.locator('button') })

test.describe('vehicle table', () => {
  test('opens on the table, in Polish', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/vehicles$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pojazdy')
    await expect(page.getByText('5 pojazdów')).toBeVisible()
    await expect(page).toHaveTitle('Pojazdy · Panel floty')
  })

  test('sorts and searches, keeping both in the URL', async ({ page }) => {
    await page.goto('/vehicles')

    await page.getByRole('button', { name: 'Nazwa' }).click()
    await page.getByRole('button', { name: 'Nazwa' }).click()
    await expect(page).toHaveURL(/sort=-name/)
    await expect(vehicleNames(page)).toHaveText([
      'Transit 05',
      'Sprinter 02',
      'Sprinter 01',
      'e-Transit Sopot',
      'Ciągnik S6',
    ])

    await page.getByRole('searchbox', { name: 'Szukaj pojazdów' }).fill('wojcik')
    await expect(vehicleNames(page)).toHaveText(['Ciągnik S6'])
    await expect(page).toHaveURL(/q=wojcik/)

    await page.reload()
    await expect(page.getByRole('searchbox')).toHaveValue('wojcik')
    await expect(vehicleNames(page)).toHaveText(['Ciągnik S6'])
    await expect(page.getByRole('columnheader', { name: 'Nazwa' })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })

  test('shows an error with a working retry', async ({ page, api }) => {
    let failures = 3 // the first load and its two automatic retries
    api.override('GET /api/vehicles', () =>
      failures-- > 0
        ? { status: 500, body: { title: 'Server error', status: 500 } }
        : { body: { items: api.vehicles, total: api.vehicles.length } },
    )
    await page.goto('/vehicles')

    await expect(page.getByRole('alert')).toContainText('Nie udało się wczytać listy pojazdów.')
    await page.getByRole('button', { name: 'Spróbuj ponownie' }).click()

    await expect(page.getByText('5 pojazdów')).toBeVisible()
  })

  test('remembers the chosen language', async ({ page }) => {
    await page.goto('/vehicles')

    await page.getByRole('combobox', { name: 'Język interfejsu' }).click()
    await page.getByRole('option', { name: 'English' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vehicles')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vehicles')
    await expect(page.getByText('5 vehicles')).toBeVisible()
  })
})
