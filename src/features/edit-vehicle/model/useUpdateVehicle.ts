import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  storeSavedVehicle,
  updateVehicle,
  vehicleKeys,
  type UpdateVehicleCommand,
} from '@/entities/vehicle'
import { isApiError } from '@/shared/api'
import { showToast } from '@/shared/ui'

export const updateVehicleMutationKey = (vehicleId: string) =>
  ['update-vehicle', vehicleId] as const

/**
 * Saves a vehicle, then writes it into both caches and shows a toast, even if the caller has
 * unmounted by then.
 */
export const useUpdateVehicle = (vehicleId: string) => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationKey: updateVehicleMutationKey(vehicleId),
    mutationFn: (command: UpdateVehicleCommand) => updateVehicle(vehicleId, command),
    onSuccess: (saved) => {
      storeSavedVehicle(queryClient, saved)
      showToast(t('editVehicle.saved', { name: saved.name }))
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 404)
        void queryClient.invalidateQueries({ queryKey: vehicleKeys.all })
    },
  })
}
