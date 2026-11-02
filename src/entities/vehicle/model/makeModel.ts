import type { Vehicle } from './types'

/** "Mercedes-Benz Sprinter": the manufacturer and model names of a vehicle. */
export const formatMakeModel = (vehicle: Pick<Vehicle, 'manufacturer' | 'model'>) =>
  `${vehicle.manufacturer.name} ${vehicle.model.name}`
