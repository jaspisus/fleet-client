const DEFAULT_API_BASE_URL = 'http://localhost:4000'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  '',
)

export const TRACKING_HUB_URL = `${API_BASE_URL}/tracking`

/** Free OpenFreeMap style that needs no API key; the dark variant matches the dark-only UI. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark'
