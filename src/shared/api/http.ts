import { API_BASE_URL } from '@/shared/config'
import { ApiError, type ProblemDetails } from './ApiError'

export interface ResourceCollection<T> {
  items: T[]
  total: number
}

interface RequestOptions {
  method?: 'GET' | 'PUT'
  body?: unknown
  signal?: AbortSignal
}

const readProblem = async (response: Response): Promise<ProblemDetails | undefined> => {
  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('json')) return undefined
  try {
    return (await response.json()) as ProblemDetails
  } catch {
    return undefined
  }
}

/** Calls the fleet API and throws an `ApiError` for network failures and non-2xx responses. */
export const apiRequest = async <T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> => {
  const hasBody = body !== undefined
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers: hasBody
        ? { Accept: 'application/json', 'Content-Type': 'application/json' }
        : { Accept: 'application/json' },
      body: hasBody ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    // Aborts come from TanStack Query cancelling a request and must stay recognisable as such.
    if (signal?.aborted) throw error
    throw ApiError.network(error)
  }

  if (!response.ok) throw new ApiError(response.status, await readProblem(response))
  return (await response.json()) as T
}
