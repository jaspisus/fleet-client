import { test as base } from '@playwright/test'
import { FIXED_NOW } from './fixtures'
import { FleetApiMock } from './mockApi'

export { expect } from '@playwright/test'
export * from './fixtures'

/** Every test runs against the mocked API, at a fixed point in time. */
export const test = base.extend<{ api: FleetApiMock }>({
  api: [
    async ({ page }, use) => {
      await page.clock.setFixedTime(FIXED_NOW)
      const api = new FleetApiMock(page)
      await api.install()
      await use(api)
    },
    { auto: true },
  ],
})
