import { fileURLToPath, URL } from 'node:url'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // MapLibre alone is ~1.1 MB and is loaded only with the map page (a lazy route chunk).
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/shared/test/setup.ts'],
    env: { TZ: 'UTC' },
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/index.ts',
        'src/shared/test/**',
        'src/app/main.tsx',
        'src/vite-env.d.ts',
        // MapLibre needs WebGL, which jsdom lacks; Playwright covers these files.
        'src/widgets/vehicle-map/ui/VehicleMapCanvas.tsx',
        'src/widgets/vehicle-map/lib/useAnimatedVehicles.ts',
        'src/widgets/vehicle-map/lib/maplibre.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
