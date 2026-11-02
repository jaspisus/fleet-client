import type { FuelType, UpdateVehicleCommand, Vehicle, VehicleType } from '@/entities/vehicle'

/** `driverId: ''` means no driver. */
export interface VehicleFormValues {
  name: string
  registrationNumber: string
  manufacturerId: string
  modelId: string
  yearOfManufacture: string
  type: VehicleType
  fuelType: FuelType
  fleetId: string
  driverId: string
}

export type VehicleFormField = keyof VehicleFormValues

export const VEHICLE_FORM_FIELDS: readonly VehicleFormField[] = [
  'name',
  'registrationNumber',
  'manufacturerId',
  'modelId',
  'yearOfManufacture',
  'type',
  'fuelType',
  'fleetId',
  'driverId',
]

export const isVehicleFormField = (value: string): value is VehicleFormField =>
  VEHICLE_FORM_FIELDS.some((field) => field === value)

export const toFormValues = (vehicle: Vehicle): VehicleFormValues => ({
  name: vehicle.name,
  registrationNumber: vehicle.registrationNumber,
  manufacturerId: vehicle.manufacturer.id,
  modelId: vehicle.model.id,
  yearOfManufacture: String(vehicle.yearOfManufacture),
  type: vehicle.type,
  fuelType: vehicle.fuelType,
  fleetId: vehicle.fleet.id,
  driverId: vehicle.driver?.id ?? '',
})

/** Builds the PUT body from values that passed validation: trims text, parses the year. */
export const toUpdateCommand = (values: VehicleFormValues): UpdateVehicleCommand => ({
  name: values.name.trim(),
  registrationNumber: values.registrationNumber.trim(),
  manufacturerId: values.manufacturerId,
  modelId: values.modelId,
  yearOfManufacture: Number(values.yearOfManufacture.trim()),
  type: values.type,
  fuelType: values.fuelType,
  fleetId: values.fleetId,
  driverId: values.driverId === '' ? null : values.driverId,
})
