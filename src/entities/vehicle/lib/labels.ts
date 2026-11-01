import { useTranslation } from 'react-i18next'
import type { FuelType, VehicleType } from '../model/types'

/** Translated labels for the vehicle enums; unknown values from the API are shown as they are. */
export const useVehicleLabels = () => {
  const { t } = useTranslation()
  return {
    vehicleType: (type: VehicleType) => t(`vehicleType.${type}`, { defaultValue: type }),
    fuelType: (fuel: FuelType) => t(`fuelType.${fuel}`, { defaultValue: fuel }),
  }
}
