export const VEHICLE_COLUMN_IDS = [
  'name',
  'registrationNumber',
  'makeModel',
  'yearOfManufacture',
  'type',
  'fuelType',
  'fleet',
  'driver',
  'actions',
] as const

export type VehicleColumnId = (typeof VEHICLE_COLUMN_IDS)[number]
export type SortableColumnId = Exclude<VehicleColumnId, 'actions'>

export const isVehicleColumnId = (value: string): value is VehicleColumnId =>
  VEHICLE_COLUMN_IDS.some((id) => id === value)

const isSortableColumnId = (value: string): value is SortableColumnId =>
  value !== 'actions' && isVehicleColumnId(value)

export interface VehicleSort {
  column: SortableColumnId
  desc: boolean
}

/** URL form of the sort: `name` (ascending) or `-name` (descending). */
export const parseSortParam = (value: string | undefined): VehicleSort | undefined => {
  if (!value) return undefined
  const desc = value.startsWith('-')
  const column = desc ? value.slice(1) : value
  return isSortableColumnId(column) ? { column, desc } : undefined
}

export const toSortParam = (sort: VehicleSort | undefined) =>
  sort ? `${sort.desc ? '-' : ''}${sort.column}` : undefined

/**
 * Search text normalisation: case, whitespace and Polish diacritics are ignored, so "wisniewska"
 * finds "Wiśniewska" and "ga4k" finds "GA 4K215".
 */
export const normalizeSearchText = (value: unknown) =>
  String(value ?? '')
    .toLowerCase()
    .replaceAll('ł', 'l')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/gu, '')
