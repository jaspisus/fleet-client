const DEFAULT_API_BASE_URL = 'http://localhost:4000'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  '',
)

export const TRACKING_HUB_URL = `${API_BASE_URL}/tracking`

/** OpenFreeMap style; needs no API key. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark'
