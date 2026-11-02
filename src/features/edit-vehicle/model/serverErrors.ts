import { isVehicleFormField } from './formValues'
import type { FieldError, ValidationKey, VehicleFormErrors } from './validation'

type MessageRule = readonly [pattern: RegExp, toError: (match: RegExpMatchArray) => FieldError]

const fixed = (key: ValidationKey) => (): FieldError => ({ key })

/** Maps the API's English-only validation messages (all listed in docs/API.md) to translation keys. */
const SERVER_MESSAGE_RULES: readonly MessageRule[] = [
  [/^Name is required\.$/, fixed('validation.name.required')],
  [
    /^Name must be between (\d+) and (\d+) characters long\.$/,
    ([, min, max]) => ({
      key: 'validation.name.length',
      params: { min: Number(min), max: Number(max) },
    }),
  ],
  [/^Registration number is required\.$/, fixed('validation.registrationNumber.required')],
  [
    /^Registration number must be at most (\d+) characters long\.$/,
    ([, max]) => ({ key: 'validation.registrationNumber.tooLong', params: { max: Number(max) } }),
  ],
  [
    /^Registration number is already used by another vehicle\.$/,
    fixed('validation.registrationNumber.taken'),
  ],
  [/^Manufacturer is required\.$/, fixed('validation.manufacturerId.required')],
  [/^Manufacturer does not exist\.$/, fixed('validation.manufacturerId.unknown')],
  [/^Model is required\.$/, fixed('validation.modelId.required')],
  [/^Model does not exist\.$/, fixed('validation.modelId.unknown')],
  [/^Model does not belong to the selected manufacturer\.$/, fixed('validation.modelId.mismatch')],
  [/^Year of manufacture is required\.$/, fixed('validation.yearOfManufacture.required')],
  [
    /^Year of manufacture must be a whole number from (\d+) to (\d+)\.$/,
    ([, min, max]) => ({
      key: 'validation.yearOfManufacture.range',
      params: { min: Number(min), max: Number(max) },
    }),
  ],
  [/^Vehicle type is required\.$/, fixed('validation.type.required')],
  [/^Vehicle type must be one of: /, fixed('validation.type.unknown')],
  [/^Fuel type is required\.$/, fixed('validation.fuelType.required')],
  [/^Fuel type must be one of: /, fixed('validation.fuelType.unknown')],
  [/^Fleet is required\.$/, fixed('validation.fleetId.required')],
  [/^Fleet does not exist\.$/, fixed('validation.fleetId.unknown')],
  [/^Driver ID is required\./, fixed('validation.driverId.required')],
  [/^Driver does not exist\.$/, fixed('validation.driverId.unknown')],
]

export const translateServerMessage = (message: string): FieldError => {
  for (const [pattern, toError] of SERVER_MESSAGE_RULES) {
    const match = message.match(pattern)
    if (match) return toError(match)
  }
  return { text: message }
}

/** Splits a 400 `errors` object into errors of form fields and messages about anything else. */
export const mapServerErrors = (errors: Record<string, string[]>) => {
  const fieldErrors: VehicleFormErrors = {}
  const otherMessages: string[] = []
  for (const [field, messages] of Object.entries(errors)) {
    const [first] = messages
    if (first === undefined) continue
    if (isVehicleFormField(field)) fieldErrors[field] = translateServerMessage(first)
    else otherMessages.push(...messages)
  }
  return { fieldErrors, otherMessages }
}
