import type { Driver } from '@/entities/driver'
import type { Fleet } from '@/entities/fleet'
import {
  isRegistrationNumberTaken,
  type Vehicle,
  type VehicleDictionaries,
} from '@/entities/vehicle'
import type { pl } from '@/shared/i18n'
import type { VehicleFormField, VehicleFormValues } from './formValues'

type ValidationMessages = (typeof pl)['validation']

/** Every `validation.<field>.<rule>` translation key. */
export type ValidationKey = {
  [
    Field in keyof ValidationMessages
  ]: `validation.${Field}.${keyof ValidationMessages[Field] & string}`
}[keyof ValidationMessages]

/** A translatable message, or a server message we do not know, shown as it came. */
export type FieldError = { key: ValidationKey; params?: Record<string, number> } | { text: string }

export type VehicleFormErrors = Partial<Record<VehicleFormField, FieldError>>

// The same rules as the API (see docs/API.md), so most mistakes are caught before saving.
export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 60
export const REGISTRATION_NUMBER_MAX_LENGTH = 50
export const FIRST_YEAR_OF_MANUFACTURE = 1950

export interface ValidationContext {
  vehicleId: string
  /** Other vehicles, for the unique registration number check. */
  vehicles: readonly Vehicle[]
  dictionaries: VehicleDictionaries
  fleets: readonly Fleet[]
  drivers: readonly Driver[]
  currentYear: number
}

const WHOLE_NUMBER = /^\d+$/

export const validateVehicleForm = (
  values: VehicleFormValues,
  context: ValidationContext,
): VehicleFormErrors => {
  const errors: VehicleFormErrors = {}

  const name = values.name.trim()
  if (name === '') errors.name = { key: 'validation.name.required' }
  else if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH)
    errors.name = {
      key: 'validation.name.length',
      params: { min: NAME_MIN_LENGTH, max: NAME_MAX_LENGTH },
    }

  const registrationNumber = values.registrationNumber.trim()
  if (registrationNumber === '')
    errors.registrationNumber = { key: 'validation.registrationNumber.required' }
  else if (registrationNumber.length > REGISTRATION_NUMBER_MAX_LENGTH)
    errors.registrationNumber = {
      key: 'validation.registrationNumber.tooLong',
      params: { max: REGISTRATION_NUMBER_MAX_LENGTH },
    }
  else if (isRegistrationNumberTaken(context.vehicles, registrationNumber, context.vehicleId))
    errors.registrationNumber = { key: 'validation.registrationNumber.taken' }

  const { vehicleManufacturer, vehicleModels, vehicleType, fuelType } = context.dictionaries
  if (values.manufacturerId === '')
    errors.manufacturerId = { key: 'validation.manufacturerId.required' }
  else if (!vehicleManufacturer.some(({ id }) => id === values.manufacturerId))
    errors.manufacturerId = { key: 'validation.manufacturerId.unknown' }

  const model = vehicleModels.find(({ id }) => id === values.modelId)
  if (values.modelId === '') errors.modelId = { key: 'validation.modelId.required' }
  else if (!model) errors.modelId = { key: 'validation.modelId.unknown' }
  else if (!errors.manufacturerId && model.manufacturerId !== values.manufacturerId)
    errors.modelId = { key: 'validation.modelId.mismatch' }

  const year = values.yearOfManufacture.trim()
  if (year === '') errors.yearOfManufacture = { key: 'validation.yearOfManufacture.required' }
  else if (
    !WHOLE_NUMBER.test(year) ||
    Number(year) < FIRST_YEAR_OF_MANUFACTURE ||
    Number(year) > context.currentYear
  )
    errors.yearOfManufacture = {
      key: 'validation.yearOfManufacture.range',
      params: { min: FIRST_YEAR_OF_MANUFACTURE, max: context.currentYear },
    }

  if (!vehicleType.includes(values.type)) errors.type = { key: 'validation.type.unknown' }
  if (!fuelType.includes(values.fuelType)) errors.fuelType = { key: 'validation.fuelType.unknown' }

  if (values.fleetId === '') errors.fleetId = { key: 'validation.fleetId.required' }
  else if (!context.fleets.some(({ id }) => id === values.fleetId))
    errors.fleetId = { key: 'validation.fleetId.unknown' }

  if (values.driverId !== '' && !context.drivers.some(({ id }) => id === values.driverId))
    errors.driverId = { key: 'validation.driverId.unknown' }

  return errors
}
