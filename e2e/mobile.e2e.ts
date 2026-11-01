import { expect, test } from './support/test'

// Below 768 px is a reduced layout: compact cards instead of a table and no sorting. A card opens
// the vehicle's details, where the key tasks must still work.
test.describe('mobile reduced mode', () => {
  test('shows a compact vehicle card', async ({ page }) => {
    await page.goto('/vehicles')

    await expect(page.getByRole('columnheader').first()).toBeHidden()
    const card = page.getByRole('row', { name: /Transit 05/ })
    await expect(card.getByText('Brak kierowcy')).toBeVisible()
    for (const text of ['Ford Transit', '2016', 'Furgon', 'Benzyna', 'Serwis Gdańsk']) {
      await expect(card.getByText(text, { exact: true })).toBeHidden()
    }
    await expect(card.getByRole('link', { name: 'Edytuj pojazd Transit 05' })).toBeHidden()
  })

  test('truncates a long name before "On map"', async ({ page }) => {
    await page.goto('/vehicles')
    const card = page.getByRole('row', { name: /Sprinter 01/ })
    const name = card.getByRole('cell').first().locator('> *')
    await name.evaluate((element) => {
      element.textContent = 'Sprinter 01 – chłodnia z windą, Dostawy Gdynia Północ'
    })

    const nameBox = await name.boundingBox()
    const mapBox = await card.getByRole('button', { name: /na mapie/ }).boundingBox()
    expect(nameBox!.x + nameBox!.width).toBeLessThanOrEqual(mapBox!.x)
    expect(await name.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
  })

  test('opens details from a card and reassigns the driver', async ({ page }) => {
    await page.goto('/vehicles')

    // The details link covers the whole card, so a tap anywhere on it opens details.
    await page.getByRole('row', { name: /Transit 05/ }).click({ position: { x: 40, y: 70 } })
    const dialog = page.getByRole('dialog', { name: 'Transit 05' })
    await expect(dialog.getByLabel('Kierowca')).toBeDisabled()
    await expect(dialog.getByRole('button', { name: 'Zapisz' })).toBeHidden()

    await dialog.getByRole('button', { name: 'Edytuj' }).click()
    await expect(dialog.getByLabel('Nazwa')).toBeFocused()
    await dialog.getByLabel('Kierowca').selectOption({ label: 'Tomasz Wójcik' })
    await dialog.getByRole('button', { name: 'Zapisz' }).click()

    await expect(dialog.getByLabel('Kierowca')).toBeDisabled()
    await expect(dialog.getByLabel('Kierowca').locator('option:checked')).toHaveText(
      'Tomasz Wójcik',
    )
    await dialog.getByRole('button', { name: 'Zamknij' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('row', { name: /Transit 05/ })).toContainText('Tomasz Wójcik')
  })

  test('goes back from edit to details, then to the list', async ({ page }) => {
    await page.goto('/vehicles')
    await page.getByRole('link', { name: 'Szczegóły pojazdu Sprinter 01' }).click()
    const dialog = page.getByRole('dialog', { name: 'Sprinter 01' })
    await dialog.getByRole('button', { name: 'Edytuj' }).click()
    await expect(page).toHaveURL(/\/edit$/)

    await page.goBack()
    await expect(dialog.getByRole('button', { name: 'Edytuj' })).toBeVisible()
    await expect(page).toHaveURL(/\/vehicles\/vehicle-sprinter-01$/)

    await page.goBack()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/vehicles$/)
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
