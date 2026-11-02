import type { Page, Request, Route, WebSocketRoute } from '@playwright/test'
import {
  API_ORIGIN,
  dictionaries,
  drivers,
  fleets,
  positions as initialPositions,
  vehicles as initialVehicles,
} from './fixtures'

export interface RecordedRequest {
  method: string
  path: string
  body: unknown
}

interface MockResponse {
  status?: number
  body: unknown
}

type Handler = (request: RecordedRequest) => MockResponse | Promise<MockResponse>

type Vehicle = (typeof initialVehicles)[number]

// SignalR JSON hub protocol: https://github.com/dotnet/aspnetcore/blob/main/src/SignalR/docs/specs/HubProtocol.md
const RECORD_SEPARATOR = '\u001e'
const INVOCATION = 1
const COMPLETION = 3
const frame = (message: unknown) => JSON.stringify(message) + RECORD_SEPARATOR

/** A map style without tiles: the map shows only the vehicles, so screenshots are stable. */
const MAP_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#1a1f27' } }],
}

const corsHeaders = (request: Request) => ({
  'Access-Control-Allow-Origin': request.headers()['origin'] ?? '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] ?? '*',
})

/**
 * Plays the fleet API inside the browser: REST, the SignalR negotiate call and the hub's
 * WebSocket. Tests can override any endpoint and push live positions.
 */
export class FleetApiMock {
  readonly requests: RecordedRequest[] = []
  vehicles: Vehicle[] = structuredClone(initialVehicles)
  snapshot: unknown[] = structuredClone(initialPositions)
  private readonly overrides = new Map<string, Handler>()
  private readonly sockets: WebSocketRoute[] = []
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /** Replaces one endpoint, e.g. `api.override('PUT /api/vehicles/x', () => ({ status: 500, body }))`. */
  override(endpoint: string, handler: Handler) {
    this.overrides.set(endpoint, handler)
  }

  /** Sends a `LiveTrack` event to every connected client. */
  pushPositions(positions: unknown[]) {
    for (const socket of this.sockets)
      socket.send(frame({ type: INVOCATION, target: 'LiveTrack', arguments: [positions] }))
  }

  /** Installs the routes; with `realMap`, map styles and tiles come from OpenFreeMap. */
  async install({ realMap = false } = {}) {
    if (!realMap)
      await this.page.route('https://tiles.openfreemap.org/**', (route) =>
        route.fulfill({ json: MAP_STYLE }),
      )
    await this.page.route(`${API_ORIGIN}/**`, (route) => this.handleHttp(route))
    await this.page.routeWebSocket(/^ws:\/\/fleet-api\.test\/tracking/, (socket) =>
      this.handleHub(socket),
    )
  }

  private async handleHttp(route: Route) {
    const request = route.request()
    const headers = corsHeaders(request)
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })

    const { pathname } = new URL(request.url())
    if (pathname === '/tracking/negotiate')
      return route.fulfill({
        headers,
        json: {
          negotiateVersion: 1,
          connectionId: 'e2e-connection',
          connectionToken: 'e2e-token',
          availableTransports: [{ transport: 'WebSockets', transferFormats: ['Text'] }],
        },
      })

    const recorded: RecordedRequest = {
      method: request.method(),
      path: pathname,
      body: request.postData() ? request.postDataJSON() : undefined,
    }
    this.requests.push(recorded)
    const endpoint = `${recorded.method} ${recorded.path}`
    const { status = 200, body } = await (this.overrides.get(endpoint) ?? this.defaultHandler)(
      recorded,
    )
    const isProblem = status >= 400
    return route.fulfill({
      status,
      headers: {
        ...headers,
        'Content-Type': isProblem ? 'application/problem+json' : 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  private readonly defaultHandler: Handler = ({ method, path, body }) => {
    const list = <T>(items: T[]) => ({ body: { items, total: items.length } })
    if (method === 'GET' && path === '/api/vehicles') return list(this.vehicles)
    if (method === 'GET' && path === '/api/drivers') return list(drivers)
    if (method === 'GET' && path === '/api/fleets') return list(fleets)
    if (method === 'GET' && path === '/api/dictionaries') return { body: dictionaries }

    const vehicleId = path.match(/^\/api\/vehicles\/([^/]+)$/)?.[1]
    const vehicle = this.vehicles.find(({ id }) => id === vehicleId)
    if (!vehicle) return { status: 404, body: { title: 'Not Found', status: 404 } }
    if (method === 'GET') return { body: vehicle }
    if (method === 'PUT') {
      const saved = this.applyUpdate(vehicle, body as Record<string, string | number | null>)
      this.vehicles = this.vehicles.map((item) => (item.id === saved.id ? saved : item))
      return { body: saved }
    }
    return { status: 405, body: { title: 'Method Not Allowed', status: 405 } }
  }

  /** Joins the IDs of an update command with their names, like the real API. */
  private applyUpdate(vehicle: Vehicle, command: Record<string, string | number | null>): Vehicle {
    const manufacturer = dictionaries.vehicleManufacturer.find(
      ({ id }) => id === command.manufacturerId,
    )
    const model = dictionaries.vehicleModels.find(({ id }) => id === command.modelId)
    const fleet = fleets.find(({ id }) => id === command.fleetId)
    const driver = drivers.find(({ id }) => id === command.driverId)
    return {
      ...vehicle,
      name: String(command.name),
      registrationNumber: String(command.registrationNumber),
      manufacturer: { id: String(manufacturer?.id), name: String(manufacturer?.key) },
      model: { id: String(model?.id), name: String(model?.key) },
      yearOfManufacture: Number(command.yearOfManufacture),
      type: String(command.type),
      fuelType: String(command.fuelType),
      fleet: { id: String(fleet?.id), name: String(fleet?.name) },
      driver: driver ? { id: driver.id, name: driver.name } : null,
    }
  }

  private handleHub(socket: WebSocketRoute) {
    this.sockets.push(socket)
    socket.onMessage((data) => {
      for (const text of String(data).split(RECORD_SEPARATOR).filter(Boolean)) {
        const message = JSON.parse(text) as {
          protocol?: string
          type?: number
          target?: string
          invocationId?: string
        }
        if (message.protocol) socket.send(`{}${RECORD_SEPARATOR}`)
        else if (message.type === INVOCATION && message.target === 'SubscribeLiveTrack')
          socket.send(
            frame({ type: COMPLETION, invocationId: message.invocationId, result: this.snapshot }),
          )
      }
    })
  }
}
