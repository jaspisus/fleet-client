import { queryOptions } from '@tanstack/react-query'
import { apiRequest, type ResourceCollection } from '@/shared/api'

export interface Driver {
  id: string
  /** Full name, e.g. "Anna Nowak". */
  name: string
  firstName: string
  lastName: string
}

export const fetchDrivers = (signal?: AbortSignal) =>
  apiRequest<ResourceCollection<Driver>>('/api/drivers', { signal })

export const driversQueryOptions = () =>
  queryOptions({
    queryKey: ['drivers'],
    queryFn: ({ signal }) => fetchDrivers(signal),
    staleTime: Infinity,
  })
