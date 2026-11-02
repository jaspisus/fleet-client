import type { TFunction } from 'i18next'
import { isApiError } from '@/shared/api'

/** A user-facing explanation of why a request failed. */
export const describeRequestError = (t: TFunction, error: unknown) => {
  if (isApiError(error)) {
    if (error.isNetworkError) return t('errors.network')
    if (error.status >= 500) return t('errors.server', { status: error.status })
  }
  return t('errors.unexpected')
}
