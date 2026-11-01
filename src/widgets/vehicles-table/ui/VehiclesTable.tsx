import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useVehicleLabels, vehiclesQueryOptions, type Vehicle } from '@/entities/vehicle'
import { selectVehicle } from '@/features/select-vehicle'
import { describeRequestError } from '@/shared/i18n'
import {
  Button,
  buttonClassName,
  EmptyState,
  ErrorState,
  LoadingState,
  TextInput,
  TruncatedText,
  VisuallyHidden,
} from '@/shared/ui'
import { isVehicleColumnId, type VehicleColumnId, type VehicleSort } from '../model/columns'
import { useVehiclesTable } from '../model/useVehiclesTable'
import styles from './VehiclesTable.module.css'

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
      return <TruncatedText className={styles.name} text={vehicle.name} />
    case 'registrationNumber':
      return <TruncatedText className={styles.plate} text={vehicle.registrationNumber} />
    case 'makeModel':
      return <TruncatedText text={`${vehicle.manufacturer.name} ${vehicle.model.name}`} />
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

/**
 * The vehicle list with search and sorting. Below 768px rows turn into cards with every detail
 * and action but no sorting; explicit ARIA roles keep the table semantics when CSS changes the
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
        <div className={styles.heading}>
          <h1 id={`${searchId}-title`} className={styles.title}>
            {t('vehicles.title')}
          </h1>
          {/* Always rendered: a live region must exist before its text changes, and the reserved
              line keeps the header from jumping when the list loads. */}
          <p className={styles.count} aria-live="polite">
            {vehiclesQuery.isSuccess && t('vehicles.count', { count: rows.length })}
          </p>
        </div>
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
