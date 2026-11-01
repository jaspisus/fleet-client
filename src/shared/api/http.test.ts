import { describe, expect, it, vi } from 'vitest'
import { ApiError, isApiError } from './ApiError'
import { apiRequest } from './http'
import { shouldRetryRequest } from './retry'

const respond = (body: unknown, init: ResponseInit & { contentType?: string } = {}) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(typeof body === 'string' ? body : JSON.stringify(body), {
          status: init.status ?? 200,
          headers: { 'Content-Type': init.contentType ?? 'application/json' },
        }),
    ),
  )

describe('apiRequest', () => {
  it('GETs JSON from the API base URL', async () => {
    respond({ items: [], total: 0 })

    await expect(apiRequest('/api/vehicles')).resolves.toEqual({ items: [], total: 0 })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/vehicles',
      expect.objectContaining({ method: 'GET', body: undefined }),
    )
  })

  it('sends a JSON body with PUT', async () => {
    respond({ id: '1' })

    await apiRequest('/api/vehicles/1', { method: 'PUT', body: { name: 'Van' } })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/vehicles/1',
      expect.objectContaining({
        method: 'PUT',
        body: '{"name":"Van"}',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
  })

  it('throws an ApiError with the problem details of an error response', async () => {
    const problem = {
      title: 'One or more validation errors occurred.',
      status: 400,
      errors: { name: ['Name is required.'] },
    }
    respond(problem, { status: 400, contentType: 'application/problem+json' })

    const error = await apiRequest('/api/vehicles/1').catch((caught: unknown) => caught)

    expect(isApiError(error)).toBe(true)
    expect(error).toMatchObject({ status: 400, problem, message: problem.title })
    expect((error as ApiError).validationErrors).toEqual(problem.errors)
  })

  it('throws an ApiError without details when the error body is not JSON', async () => {
    respond('Bad gateway', { status: 502, contentType: 'text/plain' })

    const error = (await apiRequest('/api/vehicles').catch((caught: unknown) => caught)) as ApiError

    expect(error.status).toBe(502)
    expect(error.problem).toBeUndefined()
    expect(error.validationErrors).toBeUndefined()
  })

  it('turns a failed connection into a network ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = (await apiRequest('/api/vehicles').catch((caught: unknown) => caught)) as ApiError

    expect(error.isNetworkError).toBe(true)
    expect(error.cause).toBeInstanceOf(TypeError)
  })

  it('rethrows aborts unchanged, so cancelled queries stay cancelled', async () => {
    const controller = new AbortController()
    const abort = new DOMException('Aborted', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort))
    controller.abort()

    await expect(apiRequest('/api/vehicles', { signal: controller.signal })).rejects.toBe(abort)
  })
})

describe('shouldRetryRequest', () => {
  it.each([
    ['a network error', ApiError.network(new Error('offline')), true],
    ['a 500', new ApiError(500), true],
    ['a 503', new ApiError(503), true],
    ['a 400', new ApiError(400), false],
    ['a 404', new ApiError(404), false],
    ['an unknown error', new Error('boom'), false],
  ])('%s is retried: %s', (_, error, expected) => {
    expect(shouldRetryRequest(0, error)).toBe(expected)
  })

  it('gives up after two retries', () => {
    expect(shouldRetryRequest(2, new ApiError(500))).toBe(false)
  })
})
