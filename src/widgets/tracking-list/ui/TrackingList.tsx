import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VehicleTypeIcon, type Vehicle } from '@/entities/vehicle'
import {
  getVehicleStatus,
  VehicleStatusBadge,
  type LiveTrackPosition,
  type PositionsById,
} from '@/entities/vehicle-position'
import { useFormatters } from '@/shared/i18n'
import { afterOwnAnimations, cx, prefersReducedMotion } from '@/shared/lib'
import { TruncatedText } from '@/shared/ui'
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
        <dd>
          {vehicle.driver ? <TruncatedText text={vehicle.driver.name} /> : t('vehicles.noDriver')}
        </dd>
      </div>
      <div>
        <dt>{t('map.details.fleet')}</dt>
        <dd>
          <TruncatedText text={vehicle.fleet.name} />
        </dd>
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
  const panelRef = useRef<HTMLDivElement>(null)
  const status = getVehicleStatus(position, now)
  // Details stay mounted after deselection until the panel has collapsed.
  const [showDetails, setShowDetails] = useState(isSelected)
  if (isSelected && !showDetails) setShowDetails(true)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    let cancelled = false
    afterOwnAnimations(panel, () => {
      if (cancelled) return
      if (!isSelected) {
        setShowDetails(false)
        return
      }
      // Scrolling after the expansion brings the whole details panel into view.
      itemRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    })
    return () => {
      cancelled = true
    }
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
          <VehicleTypeIcon type={vehicle.type} className={styles.typeIcon} />
          <TruncatedText className={styles.name} text={vehicle.name} />
          <VehicleStatusBadge status={status} />
          <span className={styles.chevron} aria-hidden="true" />
        </span>
        <span className={styles.meta}>
          <TruncatedText className={styles.plate} text={vehicle.registrationNumber} />
          {position && <span>{format.speed(position.speed)}</span>}
          <TruncatedText
            className={styles.reported}
            text={
              position
                ? t('map.reported', {
                    time: format.relativeTime(Date.parse(position.lastReportedTime), now),
                  })
                : t('map.noPosition')
            }
          />
        </span>
      </button>
      {/* A click anywhere on the open card collapses it, like its button. Pointer only: the button
          stays the keyboard and screen reader control. Selecting text does not collapse. */}
      <div
        ref={panelRef}
        className={styles.detailsPanel}
        onClick={() => {
          if (isSelected && !window.getSelection()?.toString()) onSelect(null)
        }}
      >
        <div className={styles.detailsClip}>
          {showDetails && <VehicleDetails vehicle={vehicle} position={position} />}
        </div>
      </div>
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
