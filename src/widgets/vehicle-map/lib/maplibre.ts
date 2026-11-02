import * as maplibre from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'

// MapLibre looks for its worker next to its own module file, which does not exist once Vite has
// bundled the library; point it at the worker file Vite serves (dev) or emits (build) instead.
maplibre.setWorkerUrl(workerUrl)

export { maplibre }
