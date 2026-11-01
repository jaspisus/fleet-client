import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useVehicleLabels, vehiclesQueryOptions, type Vehicle } from '@/entities/vehicle'
import { selectVehicle } from '@/features/select-vehicle'
import { describeRequestError } from '@/shared/i18n'
import { cx } from '@/shared/lib'
import {
  Button,
  buttonClassName,
  EmptyState,
  ErrorState,
  LoadingState,
  TextInput,
  VisuallyHidden,
} from '@/shared/ui'
import {
  COLUMNS_HIDDEN_ON_MOBILE,
  isVehicleColumnId,
  type VehicleColumnId,
  type VehicleSort,
} from '../model/columns'
import { useVehiclesTable } from '../model/useVehiclesTable'
import styles from './VehiclesTable.module.css'

const NO_VEHICLES: Vehicle[] = []

type SortDirection = 'asc' | 'desc' | false

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const

const SortIndicator = ({ direction }: { direction: SortDirection }) => (
  <span className={styles.sortIndicator} aria-hidden="true">
    {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '↕'}
  </span>
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
      <Link
        to="/vehicles/$vehicleId/edit"
        params={{ vehicleId: vehicle.id }}
        search={true}
        className={buttonClassName({ size: 'sm' })}
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
      return <span className={styles.name}>{vehicle.name}</span>
    case 'registrationNumber':
      return <span className={styles.plate}>{vehicle.registrationNumber}</span>
    case 'makeModel':
      return `${vehicle.manufacturer.name} ${vehicle.model.name}`
    case 'yearOfManufacture':
      return vehicle.yearOfManufacture
    case 'type':
      return labels.vehicleType(vehicle.type)
    case 'fuelType':
      return labels.fuelType(vehicle.fuelType)
    case 'fleet':
      return vehicle.fleet.name
    case 'driver':
      return vehicle.driver ? (
        vehicle.driver.name
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

/**
 * The vehicle list with search and sorting. Below 768px rows turn into cards (an emergency
 * layout with fewer details); explicit ARIA roles keep the table semantics when CSS changes the
 * `display` of table elements.
 */
export const VehiclesTable = ({ query, sort, onQueryChange, onSortChange }: VehiclesTableProps) => {
  const { t } = useTranslation()
  const searchId = useId()
  const vehiclesQuery = useQuery(vehiclesQueryOptions())
  const table = useVehiclesTable({
    vehicles: vehiclesQuery.data?.items ?? NO_VEHICLES,
    query,
    sort,
    onSortChange,
  })
  const rows = table.getRowModel().rows

  const columnLabel = (id: VehicleColumnId) => t(`vehicles.columns.${id}`)

  return (
    <section className={styles.section} aria-labelledby={`${searchId}-title`}>
      <div className={styles.toolbar}>
        <h1 id={`${searchId}-title`} className={styles.title}>
          {t('vehicles.title')}
        </h1>
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
        {vehiclesQuery.isSuccess && (
          <p className={styles.count} aria-live="polite">
            {t('vehicles.count', { count: rows.length })}
          </p>
        )}
      </div>

      {vehiclesQuery.isPending && <LoadingState />}

      {vehiclesQuery.isError && (
        <ErrorState
          title={t('vehicles.loadError')}
          description={describeRequestError(t, vehiclesQuery.error)}
          onRetry={() => void vehiclesQuery.refetch()}
        />
      )}

      {vehiclesQuery.isSuccess && rows.length === 0 && (
        <EmptyState>{query ? t('vehicles.noResults', { query }) : t('vehicles.empty')}</EmptyState>
      )}

      {vehiclesQuery.isSuccess && rows.length > 0 && (
        <div className={styles.scroller}>
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
                        className={cx(
                          styles.cell,
                          COLUMNS_HIDDEN_ON_MOBILE.has(id) && styles.hiddenOnMobile,
                        )}
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
