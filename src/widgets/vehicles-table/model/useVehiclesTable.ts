import {
  columnFilteringFeature,
  constructFilterFn,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type SortFn,
  type SortingState,
  type Updater,
} from '@tanstack/react-table'
import { useVehicleLabels, type Vehicle } from '@/entities/vehicle'
import { useFormatters } from '@/shared/i18n'
import { normalizeSearchText, type VehicleSort } from './columns'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
})

const columnHelper = createColumnHelper<typeof features, Vehicle>()

const includesSearchText = constructFilterFn({
  ...filterFn_includesString,
  resolveFilterValue: normalizeSearchText,
  resolveDataValue: normalizeSearchText,
})

interface UseVehiclesTableOptions {
  vehicles: Vehicle[]
  query: string
  sort: VehicleSort | undefined
  onSortChange: (sort: VehicleSort | undefined) => void
}

export const useVehiclesTable = ({
  vehicles,
  query,
  sort,
  onSortChange,
}: UseVehiclesTableOptions) => {
  const labels = useVehicleLabels()
  const { compare } = useFormatters()

  // Text columns sort with the locale's collation; translated enums sort by their label.
  const compareText: SortFn<typeof features, Vehicle> = (rowA, rowB, columnId) =>
    compare(String(rowA.getValue(columnId)), String(rowB.getValue(columnId)))
  const sortText = { sortFn: compareText }

  const columns = columnHelper.columns([
    columnHelper.accessor('name', { id: 'name', ...sortText }),
    columnHelper.accessor('registrationNumber', { id: 'registrationNumber', ...sortText }),
    columnHelper.accessor((vehicle) => `${vehicle.manufacturer.name} ${vehicle.model.name}`, {
      id: 'makeModel',
      ...sortText,
    }),
    columnHelper.accessor('yearOfManufacture', { id: 'yearOfManufacture' }),
    columnHelper.accessor((vehicle) => labels.vehicleType(vehicle.type), {
      id: 'type',
      ...sortText,
    }),
    columnHelper.accessor((vehicle) => labels.fuelType(vehicle.fuelType), {
      id: 'fuelType',
      ...sortText,
    }),
    columnHelper.accessor((vehicle) => vehicle.fleet.name, { id: 'fleet', ...sortText }),
    columnHelper.accessor((vehicle) => vehicle.driver?.name ?? '', { id: 'driver', ...sortText }),
    columnHelper.display({ id: 'actions', enableSorting: false }),
  ])

  const sorting: SortingState = sort ? [{ id: sort.column, desc: sort.desc }] : []

  const handleSortingChange = (updater: Updater<SortingState>) => {
    const [next] = typeof updater === 'function' ? updater(sorting) : updater
    onSortChange(next ? { column: next.id as VehicleSort['column'], desc: next.desc } : undefined)
  }

  return useTable({
    features,
    columns,
    data: vehicles,
    state: { sorting, globalFilter: query },
    onSortingChange: handleSortingChange,
    // Every column starts ascending; by default numeric ones would start descending.
    sortDescFirst: false,
    globalFilterFn: includesSearchText,
    getColumnCanGlobalFilter: (column) => column.id !== 'actions',
  })
}
