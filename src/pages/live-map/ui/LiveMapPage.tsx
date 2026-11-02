import { useQuery } from '@tanstack/react-query'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { vehiclesQueryOptions, type Vehicle } from '@/entities/vehicle'
import { usePositions } from '@/entities/vehicle-position'
import { ConnectionIndicator, useLiveTracking } from '@/features/live-tracking'
import { selectVehicle, useSelectedVehicleId } from '@/features/select-vehicle'
import { TrackingList } from '@/widgets/tracking-list'
import { VehicleMap } from '@/widgets/vehicle-map'
import { describeRequestError } from '@/shared/i18n'
import { useDocumentTitle, useNow } from '@/shared/lib'
import { Container, EmptyState, ErrorState, LoadingState } from '@/shared/ui'
import styles from './LiveMapPage.module.css'

const NO_VEHICLES: Vehicle[] = []

/** Vehicle list on the left, live map beside it; both share the selected vehicle. */
export const LiveMapPage = () => {
  const { t } = useTranslation()
  const titleId = useId()
  useDocumentTitle(t('app.name'), t('map.title'))
  const vehiclesQuery = useQuery(vehiclesQueryOptions())
  const vehicles = vehiclesQuery.data?.items ?? NO_VEHICLES
  const { status, reconnect } = useLiveTracking(vehicles.map((vehicle) => vehicle.id))
  const positions = usePositions()
  const selectedVehicleId = useSelectedVehicleId()
  const now = useNow()
  const hasNothingToTrack =
    vehiclesQuery.isLoadingError || (vehiclesQuery.isSuccess && vehicles.length === 0)

  return (
    <Container className={styles.layout}>
      <section className={styles.sidebar} aria-labelledby={titleId}>
        <div className={styles.sidebarHeader}>
          <h1 id={titleId} className={styles.title}>
            {t('map.title')}
          </h1>
          {!hasNothingToTrack && <ConnectionIndicator status={status} onReconnect={reconnect} />}
        </div>
        <div className={styles.listScroller}>
          {vehiclesQuery.isPending && <LoadingState />}
          {vehiclesQuery.isLoadingError && (
            <ErrorState
              title={t('map.loadError')}
              description={describeRequestError(t, vehiclesQuery.error)}
              onRetry={() => void vehiclesQuery.refetch()}
            />
          )}
          {vehiclesQuery.isSuccess && vehicles.length === 0 && (
            <EmptyState>{t('map.empty')}</EmptyState>
          )}
          {vehicles.length > 0 && (
            <TrackingList
              vehicles={vehicles}
              positions={positions}
              selectedVehicleId={selectedVehicleId}
              now={now}
              onSelect={selectVehicle}
            />
          )}
        </div>
      </section>
      <div className={styles.mapArea}>
        <VehicleMap
          vehicles={vehicles}
          positions={positions}
          selectedVehicleId={selectedVehicleId}
          now={now}
          onSelect={selectVehicle}
        />
      </div>
    </Container>
  )
}
