import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatMakeModel,
  useVehicleLabels,
  VehicleTypeIcon,
  vehiclesQueryOptions,
  type Vehicle,
} from '@/entities/vehicle'
import { selectVehicle } from '@/features/select-vehicle'
import { describeRequestError } from '@/shared/i18n'
import { cx } from '@/shared/lib'
import {
  Button,
  buttonClassName,
  EmptyState,
  ErrorState,
  TextInput,
  TruncatedText,
  VisuallyHidden,
} from '@/shared/ui'
import { isVehicleColumnId, type VehicleColumnId, type VehicleSort } from '../model/columns'
import { useVehiclesTable } from '../model/useVehiclesTable'
import styles from './VehiclesTable.module.css'
import { VehiclesLoader } from './VehiclesLoader'

const NO_VEHICLES: Vehicle[] = []

type SortDirection = 'asc' | 'desc' | false

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const

const SortIndicator = ({ direction }: { direction: SortDirection }) => (
  <svg className={styles.sortIndicator} viewBox="0 0 10 16" aria-hidden="true" focusable="false">
    <path className={direction === 'asc' ? styles.activeArrow : undefined} d="M5 1.5 8.5 6.5h-7z" />
    <path
      className={direction === 'desc' ? styles.activeArrow : undefined}
      d="M1.5 9.5h7L5 14.5z"
    />
  </svg>
)

const VehicleRowActions = ({ vehicle }: { vehicle: Vehicle }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const showOnMap = () => {
    selectVehicle(vehicle.id)
    void navigate({ to: '/map' })
  }

  return (
    <div className={styles.rowActions}>
      {/* On cards this link covers the whole card, so a tap anywhere opens details; the table
          shows Edit instead. CSS hides the one that does not apply. */}
      <Link
        to="/vehicles/$vehicleId"
        params={{ vehicleId: vehicle.id }}
        search={true}
        className={styles.cardLink}
        aria-label={t('vehicles.actions.detailsLabel', { name: vehicle.name })}
      />
      <Link
        to="/vehicles/$vehicleId/edit"
        params={{ vehicleId: vehicle.id }}
        search={true}
        className={buttonClassName({ size: 'sm', className: styles.editAction })}
        aria-label={t('vehicles.actions.editLabel', { name: vehicle.name })}
      >
        {t('vehicles.actions.edit')}
      </Link>
      <Button
        size="sm"
        variant="ghost"
        className={styles.mapAction}
        onClick={showOnMap}
        aria-label={t('vehicles.actions.showOnMapLabel', { name: vehicle.name })}
      >
        {t('vehicles.actions.showOnMap')}
      </Button>
    </div>
  )
}

const VehicleCell = ({ columnId, vehicle }: { columnId: VehicleColumnId; vehicle: Vehicle }) => {
  const { t } = useTranslation()
  const labels = useVehicleLabels()

  switch (columnId) {
    case 'name':
      return (
        <span className={styles.nameWithIcon}>
          <VehicleTypeIcon type={vehicle.type} className={styles.typeIcon} />
          <TruncatedText className={styles.name} text={vehicle.name} />
        </span>
      )
    case 'registrationNumber':
      return <TruncatedText className={styles.plate} text={vehicle.registrationNumber} />
    case 'makeModel':
      return <TruncatedText text={formatMakeModel(vehicle)} />
    case 'yearOfManufacture':
      return vehicle.yearOfManufacture
    case 'type':
      return labels.vehicleType(vehicle.type)
    case 'fuelType':
      return labels.fuelType(vehicle.fuelType)
    case 'fleet':
      return <TruncatedText text={vehicle.fleet.name} />
    case 'driver':
      return vehicle.driver ? (
        <TruncatedText text={vehicle.driver.name} />
      ) : (
        <span className={styles.muted}>{t('vehicles.noDriver')}</span>
      )
    case 'actions':
      return <VehicleRowActions vehicle={vehicle} />
  }
}

interface VehiclesTableProps {
  query: string
  sort: VehicleSort | undefined
  onQueryChange: (query: string) => void
  onSortChange: (sort: VehicleSort | undefined) => void
}

/** The vehicle list with search and sorting; below 768px rows render as compact cards. */
export const VehiclesTable = ({ query, sort, onQueryChange, onSortChange }: VehiclesTableProps) => {
  const { t } = useTranslation()
  const searchId = useId()
  const vehiclesQuery = useQuery(vehiclesQueryOptions())
  const [revealAfterLoading] = useState(() => vehiclesQuery.isPending)
  const [loaderFinished, setLoaderFinished] = useState(() => !vehiclesQuery.isPending)
  const isLoading = vehiclesQuery.isPending || !loaderFinished
  const isError = !isLoading && vehiclesQuery.isLoadingError
  const isSuccess = !isLoading && vehiclesQuery.data !== undefined
  const table = useVehiclesTable({
    vehicles: vehiclesQuery.data?.items ?? NO_VEHICLES,
    query,
    sort,
    onSortChange,
  })
  const rows = table.getRowModel().rows

  const columnLabel = (id: VehicleColumnId) => t(`vehicles.columns.${id}`)

  return (
    <section
      className={cx(styles.section, revealAfterLoading && styles.reveal)}
      aria-labelledby={`${searchId}-title`}
    >
      <div className={styles.toolbar}>
        <div className={cx(styles.heading, isLoading && styles.hiddenHeading)}>
          <h1 id={`${searchId}-title`} className={styles.title}>
            {t('vehicles.title')}
          </h1>
          {/* Always rendered: a live region must exist before its text changes. */}
          <p className={styles.count} aria-live="polite">
            {isSuccess && t('vehicles.count', { count: rows.length })}
          </p>
        </div>
        {!isLoading && (
          <div className={styles.search}>
            <label htmlFor={searchId}>
              <VisuallyHidden>{t('vehicles.searchLabel')}</VisuallyHidden>
            </label>
            <TextInput
              id={searchId}
              type="search"
              value={query}
              placeholder={t('vehicles.searchPlaceholder')}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </div>
        )}
      </div>

      {isLoading && (
        <VehiclesLoader
          loaded={!vehiclesQuery.isPending}
          onFinish={() => setLoaderFinished(true)}
        />
      )}

      {isError && (
        <ErrorState
          title={t('vehicles.loadError')}
          description={describeRequestError(t, vehiclesQuery.error)}
          onRetry={() => void vehiclesQuery.refetch()}
        />
      )}

      {isSuccess && rows.length === 0 && (
        <EmptyState>{query ? t('vehicles.noResults', { query }) : t('vehicles.empty')}</EmptyState>
      )}

      {isSuccess && rows.length > 0 && (
        <div className={styles.scroller}>
          {/* Explicit roles keep the table semantics when CSS changes `display`. */}
          <table role="table" className={styles.table}>
            <caption className={styles.caption}>{t('vehicles.title')}</caption>
            <thead role="rowgroup" className={styles.head}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr role="row" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const id = header.column.id
                    if (!isVehicleColumnId(id)) return null
                    const direction = header.column.getIsSorted()
                    const canSort = header.column.getCanSort()
                    return (
                      <th
                        role="columnheader"
                        key={header.id}
                        scope="col"
                        data-column={id}
                        aria-sort={direction ? ARIA_SORT[direction] : undefined}
                      >
                        {canSort ? (
                          <button
                            type="button"
                            className={styles.sortButton}
                            onClick={header.column.getToggleSortingHandler()}
                            title={t('vehicles.sortBy', { column: columnLabel(id) })}
                          >
                            {columnLabel(id)}
                            <SortIndicator direction={direction} />
                          </button>
                        ) : (
                          <VisuallyHidden>{columnLabel(id)}</VisuallyHidden>
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody role="rowgroup">
              {rows.map((row) => (
                <tr role="row" key={row.id} className={styles.row}>
                  {row.getAllCells().map((cell) => {
                    const id = cell.column.id
                    if (!isVehicleColumnId(id)) return null
                    return (
                      <td
                        role="cell"
                        key={cell.id}
                        data-column={id}
                        data-label={columnLabel(id)}
                        className={styles.cell}
                      >
                        <VehicleCell columnId={id} vehicle={row.original} />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
