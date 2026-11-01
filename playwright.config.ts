import { defineConfig, devices } from '@playwright/test'

const PORT = 4179

const VISUAL_WIDTHS = [390, 768, 1024, 1280, 1440, 1920, 2560]

const viewport = (width: number) => ({ width, height: width < 768 ? 844 : 900 })

export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    toHaveScreenshot: {
      // The map is WebGL rendered in software; allow tiny anti-aliasing differences.
      maxDiffPixelRatio: 0.005,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PORT}`,
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    launchOptions: {
      // Software WebGL for MapLibre in headless Chromium.
      args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
    },
  },
  projects: [
    {
      name: 'e2e-desktop',
      testMatch: /\.e2e\.ts$/,
      testIgnore: /mobile\.e2e\.ts$/,
      use: { viewport: viewport(1440) },
    },
    {
      name: 'e2e-mobile',
      testMatch: /mobile\.e2e\.ts$/,
      use: { viewport: viewport(390), hasTouch: true },
    },
    ...(process.env.VISUAL_DOCKER ? VISUAL_WIDTHS : []).map((width) => ({
      name: `visual-${width}`,
      testMatch: /\.visual\.ts$/,
      use: { viewport: viewport(width) },
    })),
  ],
  // A production build whose API host (.env.e2e) only exists in the mocks: nothing real is hit.
  webServer: {
    command: `vite build --mode e2e --outDir dist-e2e && vite preview --mode e2e --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
