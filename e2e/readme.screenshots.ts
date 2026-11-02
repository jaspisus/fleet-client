import type { Page } from '@playwright/test'
import { expect, test } from './support/test'

test.use({ realMap: true })

const save = (page: Page, name: string) => page.screenshot({ path: `docs/screenshots/${name}.png` })

test('live map at 1440 px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/map')
  const sprinter = page
    .getByRole('list', { name: 'Pojazdy' })
    .getByRole('button', { name: /^\p{L}[\p{L} ]*?Sprinter 01/u })
  await expect(sprinter).toContainText('W ruchu')
  await sprinter.click()
  await expect(page.getByRole('status').filter({ hasText: 'Połączenie' })).toContainText('Na żywo')
  await page.waitForLoadState('networkidle')
  // MapLibre fades labels in after the tiles load.
  await page.waitForTimeout(1_000)

  await save(page, 'live-map-1440')
})

for (const { width, height } of [
  { width: 768, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`vehicles at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/vehicles')
    await expect(page.getByText('5 pojazdów')).toBeVisible()

    await save(page, `vehicles-${width}`)
  })
}
