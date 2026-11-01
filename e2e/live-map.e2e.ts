import { expect, MAP_CENTER_VEHICLE, positionUpdate, test } from './support/test'

const vehicleList = (page: import('@playwright/test').Page) =>
  page.getByRole('list', { name: 'Pojazdy' })
const listItem = (page: import('@playwright/test').Page, name: string) =>
  vehicleList(page).getByRole('button', { name: new RegExp(`^${name}`) })

test.describe('live map', () => {
  test('shows live positions and updates them as reports come in', async ({ page, api }) => {
    await page.goto('/map')

    await expect(page.getByRole('status').filter({ hasText: 'Połączenie' })).toContainText(
      'Połączenie: Na żywo',
    )
    await expect(listItem(page, 'Sprinter 01')).toContainText('W ruchu')
    await expect(listItem(page, 'Sprinter 01')).toContainText('41 km/godz.')
    await expect(listItem(page, 'Sprinter 02')).toContainText('Postój')
    await expect(listItem(page, 'Ciągnik S6')).toContainText('Offline')
    await expect(listItem(page, 'Ciągnik S6')).toContainText('Raport 3 dni temu')
    await expect(listItem(page, 'Transit 05')).toContainText('Brak sygnału')

    api.pushPositions([positionUpdate('vehicle-sprinter-02', { speed: 52 })])

    await expect(listItem(page, 'Sprinter 02')).toContainText('W ruchu')
    await expect(listItem(page, 'Sprinter 02')).toContainText('52 km/godz.')
  })

  test('selects on the map what is picked in the list, and the other way round', async ({
    page,
  }) => {
    await page.goto('/map')
    const map = page.getByRole('region', { name: 'Mapa pozycji pojazdów' })
    await expect(map.locator('canvas')).toBeVisible()

    await listItem(page, 'Sprinter 01').click()
    await expect(listItem(page, 'Sprinter 01')).toHaveAttribute('aria-pressed', 'true')
    await expect(vehicleList(page)).toContainText('Anna Nowak')

    // The vehicle in the middle of the initial view; wait until the map has drawn it.
    await expect(listItem(page, MAP_CENTER_VEHICLE)).toContainText('W ruchu')
    await page.waitForTimeout(500)
    await map.locator('canvas').click()
    await expect(listItem(page, MAP_CENTER_VEHICLE)).toHaveAttribute('aria-pressed', 'true')
    await expect(listItem(page, 'Sprinter 01')).toHaveAttribute('aria-pressed', 'false')

    // A click on the empty map clears the selection.
    const box = await map.locator('canvas').boundingBox()
    await map.locator('canvas').click({ position: { x: 20, y: (box?.height ?? 200) - 20 } })
    await expect(vehicleList(page).getByRole('button', { pressed: true })).toHaveCount(0)
  })

  test('"Show on map" in the table opens the map with the vehicle selected', async ({ page }) => {
    await page.goto('/vehicles')

    await page.getByRole('button', { name: 'Pokaż pojazd Sprinter 02 na mapie' }).click()

    await expect(page).toHaveURL(/\/map$/)
    await expect(listItem(page, 'Sprinter 02')).toHaveAttribute('aria-pressed', 'true')
  })
})
