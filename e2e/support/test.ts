import { test as base } from '@playwright/test'
import { FIXED_NOW } from './fixtures'
import { FleetApiMock } from './mockApi'

export { expect } from '@playwright/test'
export * from './fixtures'

/** Every test runs against the mocked API, at a fixed point in time. */
export const test = base.extend<{ api: FleetApiMock; realMap: boolean }>({
  realMap: [false, { option: true }],
  api: [
    async ({ page, realMap }, use) => {
      await page.clock.setFixedTime(FIXED_NOW)
      const api = new FleetApiMock(page)
      await api.install({ realMap })
      await use(api)
    },
    { auto: true },
  ],
})
