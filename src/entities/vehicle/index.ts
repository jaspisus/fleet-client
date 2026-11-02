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
export { formatMakeModel } from './model/makeModel'
export { isRegistrationNumberTaken } from './model/registration'
export {
  isFuelType,
  isVehicleType,
  type FuelType,
  type UpdateVehicleCommand,
  type Vehicle,
  type VehicleDictionaries,
  type VehicleType,
} from './model/types'
