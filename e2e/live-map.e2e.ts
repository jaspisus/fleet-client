import type { Locator, Page } from '@playwright/test'
import { expect, FIXED_NOW, MAP_CENTER_VEHICLE, positionUpdate, test } from './support/test'

const vehicleList = (page: Page) => page.getByRole('list', { name: 'Pojazdy' })
const listItem = (page: Page, name: string) =>
  vehicleList(page).getByRole('button', { name: new RegExp(`^\\p{L}[\\p{L} ]*?${name}`, 'u') })

/** Returns the canvas centre in page coordinates. */
const canvasCenter = async (canvas: Locator) => {
  const box = await canvas.boundingBox()
  if (!box) throw new Error('The map canvas is not visible')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/** Hovers a point of the map with a fresh `mousemove`, even if the mouse is already there. */
const hover = async (page: Page, point: { x: number; y: number }) => {
  await page.mouse.move(point.x - 200, point.y - 200)
  await page.mouse.move(point.x, point.y)
}

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

    await expect(listItem(page, MAP_CENTER_VEHICLE)).toContainText('W ruchu')
    // The canvas gives no signal when a marker has been drawn.
    await page.waitForTimeout(500)
    await map.locator('canvas').click()
    await expect(listItem(page, MAP_CENTER_VEHICLE)).toHaveAttribute('aria-pressed', 'true')

    await listItem(page, 'Sprinter 01').click()
    await expect(listItem(page, 'Sprinter 01')).toHaveAttribute('aria-pressed', 'true')
    await expect(listItem(page, MAP_CENTER_VEHICLE)).toHaveAttribute('aria-pressed', 'false')
    await expect(vehicleList(page)).toContainText('Anna Nowak')

    const box = await map.locator('canvas').boundingBox()
    await map.locator('canvas').click({ position: { x: 20, y: (box?.height ?? 200) - 20 } })
    await expect(vehicleList(page).getByRole('button', { pressed: true })).toHaveCount(0)
  })

  test('follows the selected vehicle until the map is dragged', async ({ page, api }) => {
    await page.goto('/map')
    const canvas = page.getByRole('region', { name: 'Mapa pozycji pojazdów' }).locator('canvas')
    await expect(canvas).toBeVisible()
    await expect(listItem(page, 'Sprinter 01')).toContainText('W ruchu')
    const center = await canvasCenter(canvas)
    api.pushPositions([positionUpdate('vehicle-etransit', { latitude: 54.4, speed: 30 })])
    await expect(listItem(page, MAP_CENTER_VEHICLE)).toContainText('30 km/godz.')
    await hover(page, center)
    await expect(canvas).not.toHaveCSS('cursor', 'pointer')

    await listItem(page, 'Sprinter 01').click()
    await hover(page, center)
    await expect(canvas).toHaveCSS('cursor', 'pointer')

    api.pushPositions([
      positionUpdate('vehicle-sprinter-01', {
        latitude: 54.5223,
        speed: 43,
        lastReportedTime: new Date(FIXED_NOW.getTime() - 1_000).toISOString(),
      }),
    ])
    await expect(listItem(page, 'Sprinter 01')).toContainText('43 km/godz.')
    await hover(page, center)
    await expect(canvas).toHaveCSS('cursor', 'pointer')

    const dragged = { x: center.x + 150, y: center.y + 100 }
    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    await page.mouse.move(dragged.x, dragged.y, { steps: 10 })
    // Let MapLibre's inertia buffer expire, so the map does not glide on after the release.
    await page.waitForTimeout(300)
    await page.mouse.up()

    api.pushPositions([positionUpdate('vehicle-sprinter-01', { latitude: 54.5223, speed: 45 })])
    await expect(listItem(page, 'Sprinter 01')).toContainText('45 km/godz.')
    await hover(page, center)
    await expect(canvas).not.toHaveCSS('cursor', 'pointer')

    await page.mouse.click(dragged.x, dragged.y)
    await expect(listItem(page, 'Sprinter 01')).toHaveAttribute('aria-pressed', 'true')
    await hover(page, center)
    await expect(canvas).toHaveCSS('cursor', 'pointer')
  })

  test('expands the details of the picked vehicle, and a click on them collapses it', async ({
    page,
  }) => {
    await page.goto('/map')
    const details = vehicleList(page).getByText('Anna Nowak')

    await listItem(page, 'Sprinter 01').click()
    await expect(details).toBeVisible()
    await expect(details).toBeInViewport()

    await details.click()
    await expect(listItem(page, 'Sprinter 01')).toHaveAttribute('aria-pressed', 'false')
    await expect(details).toHaveCount(0)
  })

  test('"Show on map" in the table opens the map with the vehicle selected', async ({ page }) => {
    await page.goto('/vehicles')

    await page.getByRole('button', { name: 'Pokaż pojazd Sprinter 02 na mapie' }).click()

    await expect(page).toHaveURL(/\/map$/)
    await expect(listItem(page, 'Sprinter 02')).toHaveAttribute('aria-pressed', 'true')
  })
})
