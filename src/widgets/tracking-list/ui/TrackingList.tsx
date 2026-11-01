import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Vehicle } from '@/entities/vehicle'
import {
  getVehicleStatus,
  VehicleStatusBadge,
  type LiveTrackPosition,
  type PositionsById,
} from '@/entities/vehicle-position'
import { useFormatters } from '@/shared/i18n'
import { cx, prefersReducedMotion } from '@/shared/lib'
import styles from './TrackingList.module.css'

interface VehicleDetailsProps {
  vehicle: Vehicle
  position: LiveTrackPosition | undefined
}

const VehicleDetails = ({ vehicle, position }: VehicleDetailsProps) => {
  const { t } = useTranslation()
  const format = useFormatters()

  return (
    <dl className={styles.details}>
      <div>
        <dt>{t('map.details.driver')}</dt>
        <dd>{vehicle.driver?.name ?? t('vehicles.noDriver')}</dd>
      </div>
      <div>
        <dt>{t('map.details.fleet')}</dt>
        <dd>{vehicle.fleet.name}</dd>
      </div>
      {position && (
        <>
          <div>
            <dt>{t('map.details.speed')}</dt>
            <dd>{format.speed(position.speed)}</dd>
          </div>
          <div>
            <dt>{t('map.details.heading')}</dt>
            <dd>
              <span
                className={styles.headingArrow}
                style={{ rotate: `${position.heading}deg` }}
                aria-hidden="true"
              >
                ↑
              </span>{' '}
              {position.heading}°
            </dd>
          </div>
          <div className={styles.wide}>
            <dt>{t('map.details.lastReport')}</dt>
            <dd>{format.dateTime(Date.parse(position.lastReportedTime))}</dd>
          </div>
        </>
      )}
    </dl>
  )
}

interface TrackingListItemProps {
  vehicle: Vehicle
  position: LiveTrackPosition | undefined
  isSelected: boolean
  now: number
  onSelect: (vehicleId: string | null) => void
}

const TrackingListItem = ({
  vehicle,
  position,
  isSelected,
  now,
  onSelect,
}: TrackingListItemProps) => {
  const { t } = useTranslation()
  const format = useFormatters()
  const itemRef = useRef<HTMLLIElement>(null)
  const status = getVehicleStatus(position, now)

  // Keep the selected vehicle visible, e.g. after it was picked on the map.
  useEffect(() => {
    if (isSelected)
      itemRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
  }, [isSelected])

  return (
    <li ref={itemRef} className={cx(styles.item, isSelected && styles.selected)}>
      <button
        type="button"
        className={styles.button}
        aria-pressed={isSelected}
        onClick={() => onSelect(isSelected ? null : vehicle.id)}
      >
        <span className={styles.summary}>
          <span className={styles.name}>{vehicle.name}</span>
          <VehicleStatusBadge status={status} />
        </span>
        <span className={styles.meta}>
          <span className={styles.plate}>{vehicle.registrationNumber}</span>
          {position && <span>{format.speed(position.speed)}</span>}
          <span className={styles.reported}>
            {position
              ? t('map.reported', {
                  time: format.relativeTime(Date.parse(position.lastReportedTime), now),
                })
              : t('map.noPosition')}
          </span>
        </span>
      </button>
      {isSelected && <VehicleDetails vehicle={vehicle} position={position} />}
    </li>
  )
}

interface TrackingListProps {
  vehicles: readonly Vehicle[]
  positions: PositionsById
  selectedVehicleId: string | null
  now: number
  onSelect: (vehicleId: string | null) => void
}

/** Vehicles next to the live map; selecting one here selects it on the map, and vice versa. */
export const TrackingList = ({
  vehicles,
  positions,
  selectedVehicleId,
  now,
  onSelect,
}: TrackingListProps) => {
  const { t } = useTranslation()
  const { compare } = useFormatters()
  const sortedVehicles = [...vehicles].sort((a, b) => compare(a.name, b.name))

  return (
    <ul className={styles.list} aria-label={t('map.listLabel')}>
      {sortedVehicles.map((vehicle) => (
        <TrackingListItem
          key={vehicle.id}
          vehicle={vehicle}
          position={positions[vehicle.id]}
          isSelected={vehicle.id === selectedVehicleId}
          now={now}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}
