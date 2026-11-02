/** RFC 9457 Problem Details, as returned by every error response of the API. */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  /** Present on 400 validation problems: messages per request body field. */
  errors?: Record<string, string[]>
}

const NETWORK_ERROR_STATUS = 0

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails | undefined

  constructor(status: number, problem?: ProblemDetails, options?: ErrorOptions) {
    super(
      problem?.title ??
        (status === NETWORK_ERROR_STATUS
          ? 'Network error'
          : `Request failed with status ${status}`),
      options,
    )
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }

  static network(cause: unknown) {
    return new ApiError(NETWORK_ERROR_STATUS, undefined, { cause })
  }

  get isNetworkError() {
    return this.status === NETWORK_ERROR_STATUS
  }

  get validationErrors(): Record<string, string[]> | undefined {
    return this.status === 400 ? this.problem?.errors : undefined
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError
