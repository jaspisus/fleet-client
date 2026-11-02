import { vi } from 'vitest'

type Handler = (...args: never[]) => void

/** A stand-in for `HubConnection` that tests drive by hand. */
export class FakeHubConnection {
  state: 'Disconnected' | 'Connecting' | 'Connected' = 'Disconnected'
  readonly url: string
  private readonly handlers = new Map<string, Handler>()
  private readonly reconnectingCallbacks: Array<() => void> = []
  private readonly reconnectedCallbacks: Array<() => void> = []
  private readonly closeCallbacks: Array<() => void> = []
  snapshot: unknown[] = []

  constructor(url: string) {
    this.url = url
  }

  start = vi.fn(async () => {
    this.state = 'Connected'
  })

  stop = vi.fn(async () => {
    const wasConnected = this.state !== 'Disconnected'
    this.state = 'Disconnected'
    if (wasConnected) this.closeCallbacks.forEach((callback) => callback())
  })

  invoke = vi.fn(async (_method: string, ..._args: unknown[]) => this.snapshot)

  on(method: string, handler: Handler) {
    this.handlers.set(method, handler)
  }

  onreconnecting(callback: () => void) {
    this.reconnectingCallbacks.push(callback)
  }

  onreconnected(callback: () => void) {
    this.reconnectedCallbacks.push(callback)
  }

  onclose(callback: () => void) {
    this.closeCallbacks.push(callback)
  }

  /** Simulates a message from the server, e.g. `emit('LiveTrack', positions)`. */
  emit(method: string, ...args: unknown[]) {
    ;(this.handlers.get(method) as ((...values: unknown[]) => void) | undefined)?.(...args)
  }

  simulateReconnecting() {
    this.state = 'Connecting'
    this.reconnectingCallbacks.forEach((callback) => callback())
  }

  simulateReconnected() {
    this.state = 'Connected'
    this.reconnectedCallbacks.forEach((callback) => callback())
  }

  simulateClose() {
    this.state = 'Disconnected'
    this.closeCallbacks.forEach((callback) => callback())
  }
}

export const fakeConnections: FakeHubConnection[] = []

/** Module factory for `vi.mock('@microsoft/signalr', ...)`. */
export const fakeSignalRModule = () => ({
  HubConnectionBuilder: class {
    private url = ''
    withUrl(url: string) {
      this.url = url
      return this
    }
    withAutomaticReconnect() {
      return this
    }
    configureLogging() {
      return this
    }
    build() {
      const connection = new FakeHubConnection(this.url)
      fakeConnections.push(connection)
      return connection
    }
  },
  HubConnectionState: {
    Disconnected: 'Disconnected',
    Connecting: 'Connecting',
    Connected: 'Connected',
  },
  LogLevel: { Warning: 3 },
})
