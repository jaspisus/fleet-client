import { expect, test } from './support/test'

// Mobile is an emergency-access layout: fewer details, but the key tasks must work.
test.describe('mobile emergency access', () => {
  test('reassigns a driver from a vehicle card', async ({ page }) => {
    await page.goto('/vehicles')

    await expect(page.getByRole('columnheader').first()).toBeHidden()
    await page.getByRole('link', { name: 'Edytuj pojazd Transit 05' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Kierowca').selectOption({ label: 'Tomasz Wójcik' })
    await dialog.getByRole('button', { name: 'Zapisz' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('row', { name: /Transit 05/ })).toContainText('Tomasz Wójcik')
  })

  test('follows a vehicle on the map', async ({ page }) => {
    await page.goto('/map')
    const map = page.getByRole('region', { name: 'Mapa pozycji pojazdów' })
    await expect(map).toBeVisible()

    const item = page.getByRole('list', { name: 'Pojazdy' }).getByRole('button', {
      name: /^Sprinter 01/,
    })
    await item.click()

    await expect(item).toHaveAttribute('aria-pressed', 'true')
    await expect(map).toBeInViewport()
  })
})
