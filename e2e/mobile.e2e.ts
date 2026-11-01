import { expect, test } from './support/test'

// Below 768 px is a reduced layout: cards instead of a table and no sorting, but every detail and
// the key tasks must work.
test.describe('mobile reduced mode', () => {
  test('shows every column on a vehicle card', async ({ page }) => {
    await page.goto('/vehicles')

    await expect(page.getByRole('columnheader').first()).toBeHidden()
    const card = page.getByRole('row', { name: /Transit 05/ })
    for (const text of ['Ford Transit', '2016', 'Furgon', 'Benzyna', 'Serwis Gdańsk']) {
      await expect(card.getByText(text, { exact: true })).toBeVisible()
    }
    await expect(card.getByText('Brak kierowcy')).toBeVisible()
  })

  test('reassigns a driver from a vehicle card', async ({ page }) => {
    await page.goto('/vehicles')

    await page.getByRole('link', { name: 'Edytuj pojazd Transit 05' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Kierowca').selectOption({ label: 'Tomasz Wójcik' })
    await dialog.getByRole('button', { name: 'Zapisz' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('row', { name: /Transit 05/ })).toContainText('Tomasz Wójcik')
  })

  test('opens a vehicle card on the map', async ({ page }) => {
    await page.goto('/vehicles')

    await page.getByRole('button', { name: 'Pokaż pojazd Sprinter 02 na mapie' }).click()

    await expect(page).toHaveURL(/\/map$/)
    await expect(
      page.getByRole('list', { name: 'Pojazdy' }).getByRole('button', { name: /^Sprinter 02/ }),
    ).toHaveAttribute('aria-pressed', 'true')
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
