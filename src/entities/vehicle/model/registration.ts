import type { Vehicle } from './types'

/** The API compares plates without whitespace and letter case: "GA 4K215" equals "ga4k215". */
export const normalizeRegistrationNumber = (registrationNumber: string) =>
  registrationNumber.replaceAll(/\s/gu, '').toUpperCase()

export const isRegistrationNumberTaken = (
  vehicles: readonly Pick<Vehicle, 'id' | 'registrationNumber'>[],
  registrationNumber: string,
  exceptVehicleId: string,
) => {
  const wanted = normalizeRegistrationNumber(registrationNumber)
  return vehicles.some(
    (vehicle) =>
      vehicle.id !== exceptVehicleId &&
      normalizeRegistrationNumber(vehicle.registrationNumber) === wanted,
  )
}
