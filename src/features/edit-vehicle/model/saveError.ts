import { isApiError } from '@/shared/api'
import { mapServerErrors } from './serverErrors'
import type { ValidationKey, VehicleFormErrors } from './validation'

export type FormMessageKey =
  'editVehicle.invalid' | 'editVehicle.vehicleMissing' | 'editVehicle.saveFailed' | 'errors.network'

/** A message for the whole form or one field: a translation key, or text to show as is. */
export type TranslatableMessage =
  { key: ValidationKey | FormMessageKey; params?: Record<string, number> } | { text: string }

interface SaveErrorDescription {
  fieldErrors: VehicleFormErrors
  message: TranslatableMessage
}

/** Turns a failed save into field errors and a form-level message. */
export const describeSaveError = (error: unknown): SaveErrorDescription => {
  if (isApiError(error)) {
    const { validationErrors } = error
    if (validationErrors) {
      const { fieldErrors, otherMessages } = mapServerErrors(validationErrors)
      return {
        fieldErrors,
        message:
          otherMessages.length > 0
            ? { text: otherMessages.join(' ') }
            : { key: 'editVehicle.invalid' },
      }
    }
    if (error.status === 404)
      return { fieldErrors: {}, message: { key: 'editVehicle.vehicleMissing' } }
    if (error.isNetworkError) return { fieldErrors: {}, message: { key: 'errors.network' } }
  }
  return { fieldErrors: {}, message: { key: 'editVehicle.saveFailed' } }
}
