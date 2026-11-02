import { vi } from 'vitest'
import { dictionaries, drivers, fleets, vehicles } from './fixtures'

export interface StubbedRequest {
  method: string
  path: string
  body: unknown
}

type RouteHandler = (request: StubbedRequest) => Response | Promise<Response>
export type ApiRoutes = Record<string, RouteHandler>

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })

export const problemResponse = (status: number, problem: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ title: 'Problem', status, ...problem }), {
    status,
    headers: { 'Content-Type': 'application/problem+json; charset=utf-8' },
  })

/** A response that never arrives, to keep a request pending. */
export const pendingResponse = () => new Promise<Response>(() => {})

/** The happy-path API: every GET the app makes, answered from the fixtures. */
export const defaultApiRoutes = (): ApiRoutes => ({
  'GET /api/vehicles': () => jsonResponse({ items: vehicles, total: vehicles.length }),
  'GET /api/drivers': () => jsonResponse({ items: drivers, total: drivers.length }),
  'GET /api/fleets': () => jsonResponse({ items: fleets, total: fleets.length }),
  'GET /api/dictionaries': () => jsonResponse(dictionaries),
  ...Object.fromEntries(
    vehicles.map((vehicle) => [`GET /api/vehicles/${vehicle.id}`, () => jsonResponse(vehicle)]),
  ),
})

/** Replaces `fetch` with a router keyed by "METHOD /path"; unknown routes answer 404. */
export const stubApi = (overrides: ApiRoutes = {}) => {
  const routes = { ...defaultApiRoutes(), ...overrides }
  const requests: StubbedRequest[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    const request: StubbedRequest = {
      method: init?.method ?? 'GET',
      path: url.pathname,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    }
    requests.push(request)
    const handler = routes[`${request.method} ${request.path}`]
    return handler ? handler(request) : problemResponse(404, { title: 'Not Found' })
  })
  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, requests, routes }
}
