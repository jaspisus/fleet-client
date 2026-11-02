export {
  storeSavedVehicle,
  vehicleDictionariesQueryOptions,
  vehicleKeys,
  vehicleQueryOptions,
  vehiclesQueryOptions,
} from './api/queries'
export { updateVehicle } from './api/vehicleApi'
export { useVehicleLabels } from './lib/labels'
export { VehicleTypeIcon } from './ui/VehicleTypeIcon'
export { isRegistrationNumberTaken, normalizeRegistrationNumber } from './model/registration'
export {
  FUEL_TYPES,
  isFuelType,
  isVehicleType,
  VEHICLE_TYPES,
  type EntityReference,
  type FuelType,
  type UpdateVehicleCommand,
  type Vehicle,
  type VehicleDictionaries,
  type VehicleManufacturer,
  type VehicleModel,
  type VehicleType,
} from './model/types'
