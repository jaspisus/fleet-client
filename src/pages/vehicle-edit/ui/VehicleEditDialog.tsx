import { useIsMutating, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { driversQueryOptions } from '@/entities/driver'
import { fleetsQueryOptions } from '@/entities/fleet'
import {
  vehicleDictionariesQueryOptions,
  vehicleQueryOptions,
  vehiclesQueryOptions,
} from '@/entities/vehicle'
import { EditVehicleForm, updateVehicleMutationKey } from '@/features/edit-vehicle'
import { isApiError } from '@/shared/api'
import { describeRequestError } from '@/shared/i18n'
import { useDocumentTitle } from '@/shared/lib'
import { Dialog, ErrorState, LoadingState, useCloseDialog } from '@/shared/ui'

interface VehicleEditContentProps {
  vehicleId: string
}

const VehicleEditContent = ({ vehicleId }: VehicleEditContentProps) => {
  const { t } = useTranslation()
  const closeDialog = useCloseDialog()
  const queryClient = useQueryClient()
  const vehicleQuery = useQuery(vehicleQueryOptions(vehicleId, queryClient))
  const vehiclesQuery = useQuery(vehiclesQueryOptions())
  const dictionariesQuery = useQuery(vehicleDictionariesQueryOptions())
  const fleetsQuery = useQuery(fleetsQueryOptions())
  const driversQuery = useQuery(driversQueryOptions())
  const queries = [vehicleQuery, vehiclesQuery, dictionariesQuery, fleetsQuery, driversQuery]

  if (isApiError(vehicleQuery.error) && vehicleQuery.error.status === 404)
    return <ErrorState title={t('editVehicle.notFound')} />

  const failedQuery = queries.find((query) => query.isError)
  if (failedQuery)
    return (
      <ErrorState
        title={t('editVehicle.loadError')}
        description={describeRequestError(t, failedQuery.error)}
        onRetry={() => {
          for (const query of queries) if (query.isError) void query.refetch()
        }}
      />
    )

  if (
    !vehicleQuery.data ||
    !vehiclesQuery.data ||
    !dictionariesQuery.data ||
    !fleetsQuery.data ||
    !driversQuery.data
  )
    return <LoadingState />

  return (
    <EditVehicleForm
      key={vehicleId}
      vehicle={vehicleQuery.data}
      vehicles={vehiclesQuery.data.items}
      dictionaries={dictionariesQuery.data}
      fleets={fleetsQuery.data.items}
      drivers={driversQuery.data.items}
      onSaved={closeDialog}
      onCancel={closeDialog}
    />
  )
}

interface VehicleEditDialogProps {
  vehicleId: string
  onClose: () => void
}

/** The edit form in a modal over the vehicle table, at /vehicles/$vehicleId/edit. */
export const VehicleEditDialog = ({ vehicleId, onClose }: VehicleEditDialogProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: vehicle } = useQuery(vehicleQueryOptions(vehicleId, queryClient))
  const isSaving = useIsMutating({ mutationKey: updateVehicleMutationKey(vehicleId) }) > 0
  const title = vehicle ? `${t('editVehicle.title')}: ${vehicle.name}` : t('editVehicle.title')
  useDocumentTitle(t('app.name'), title)

  return (
    <Dialog title={title} onClose={onClose} closeDisabled={isSaving}>
      <VehicleEditContent vehicleId={vehicleId} />
    </Dialog>
  )
}
