import { isApiError } from './ApiError'

const MAX_RETRIES = 2

/** Retries only failures that may succeed on a second try: network errors and 5xx responses. */
export const shouldRetryRequest = (failureCount: number, error: unknown) =>
  failureCount < MAX_RETRIES && isApiError(error) && (error.isNetworkError || error.status >= 500)
