export const VEHICLE_TYPES = ['Unknown', 'Car', 'Van', 'SmallRigidTruck', 'TractorTrailer'] as const
export type VehicleType = (typeof VEHICLE_TYPES)[number]

export const FUEL_TYPES = ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'LPG', 'Other'] as const
export type FuelType = (typeof FUEL_TYPES)[number]

export const isVehicleType = (value: unknown): value is VehicleType =>
  VEHICLE_TYPES.some((type) => type === value)

export const isFuelType = (value: unknown): value is FuelType =>
  FUEL_TYPES.some((type) => type === value)

/** A short reference to another object. */
export interface EntityReference {
  id: string
  name: string
}

export interface Vehicle {
  id: string
  name: string
  registrationNumber: string
  manufacturer: EntityReference
  model: EntityReference
  yearOfManufacture: number
  type: VehicleType
  fuelType: FuelType
  fleet: EntityReference
  driver: EntityReference | null
}

/** Body of `PUT /api/vehicles/{id}`: every field is required, `driverId` may be `null`. */
export interface UpdateVehicleCommand {
  name: string
  registrationNumber: string
  manufacturerId: string
  modelId: string
  yearOfManufacture: number
  type: VehicleType
  fuelType: FuelType
  fleetId: string
  driverId: string | null
}

export interface VehicleManufacturer {
  id: string
  key: string
}

export interface VehicleModel {
  id: string
  key: string
  manufacturerId: string
  manufacturerName: string
}

/** Every fixed list a vehicle field can take its value from (`GET /api/dictionaries`). */
export interface VehicleDictionaries {
  vehicleType: VehicleType[]
  fuelType: FuelType[]
  vehicleManufacturer: VehicleManufacturer[]
  vehicleModels: VehicleModel[]
}
