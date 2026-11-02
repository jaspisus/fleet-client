import { useIsMutating, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
import { Button, Dialog, ErrorState, LoadingState, useCloseDialog } from '@/shared/ui'

type VehicleDialogMode = 'view' | 'edit'

interface VehicleDialogContentProps {
  vehicleId: string
  mode: VehicleDialogMode
  autoFocus: boolean
  onEditEnd: (() => void) | undefined
}

const VehicleDialogContent = ({
  vehicleId,
  mode,
  autoFocus,
  onEditEnd,
}: VehicleDialogContentProps) => {
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

  const failedQuery = queries.find((query) => query.isLoadingError)
  if (failedQuery)
    return (
      <ErrorState
        title={t('editVehicle.loadError')}
        description={describeRequestError(t, failedQuery.error)}
        onRetry={() => {
          for (const query of queries) if (query.isLoadingError) void query.refetch()
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
      // Leaving edit mode discards unsaved changes.
      key={`${vehicleId}-${mode}`}
      readOnly={mode === 'view'}
      autoFocus={autoFocus}
      vehicle={vehicleQuery.data}
      vehicles={vehiclesQuery.data.items}
      dictionaries={dictionariesQuery.data}
      fleets={fleetsQuery.data.items}
      drivers={driversQuery.data.items}
      onSaved={onEditEnd ?? closeDialog}
      onCancel={onEditEnd ?? closeDialog}
    />
  )
}

interface VehicleDialogProps {
  vehicleId: string
  /** `view` shows the same form locked, without Save and Cancel, and with Edit in the header. */
  mode?: VehicleDialogMode
  onClose: () => void
  onEdit?: () => void
  /** Where Save and Cancel lead in edit mode; by default they close the dialog. */
  onEditEnd?: () => void
}

/**
 * Vehicle details and the edit form in a modal over the vehicle table, at /vehicles/$vehicleId
 * and /vehicles/$vehicleId/edit.
 */
export const VehicleDialog = ({
  vehicleId,
  mode = 'edit',
  onClose,
  onEdit,
  onEditEnd,
}: VehicleDialogProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: vehicle } = useQuery(vehicleQueryOptions(vehicleId, queryClient))
  const isSaving = useIsMutating({ mutationKey: updateVehicleMutationKey(vehicleId) }) > 0
  const heading = t(mode === 'view' ? 'editVehicle.detailsTitle' : 'editVehicle.title')
  const title = vehicle ? vehicle.name : heading
  useDocumentTitle(t('app.name'), title)

  // A mode switch removes the focused button (Edit, or Save/Cancel), so the new content takes
  // focus. On open, `showModal()` places it.
  const [previousMode, setPreviousMode] = useState(mode)
  const [modeChanged, setModeChanged] = useState(false)
  if (mode !== previousMode) {
    setPreviousMode(mode)
    setModeChanged(true)
  }

  return (
    <Dialog
      title={title}
      onClose={onClose}
      closeDisabled={isSaving}
      actions={
        mode === 'view' &&
        vehicle &&
        onEdit && (
          <Button size="sm" onClick={onEdit} autoFocus={modeChanged}>
            {t('vehicles.actions.edit')}
          </Button>
        )
      }
    >
      <VehicleDialogContent
        vehicleId={vehicleId}
        mode={mode}
        autoFocus={modeChanged}
        onEditEnd={onEditEnd}
      />
    </Dialog>
  )
}
