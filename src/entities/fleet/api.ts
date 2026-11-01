import { queryOptions } from '@tanstack/react-query'
import { apiRequest, type ResourceCollection } from '@/shared/api'

export interface Fleet {
  id: string
  name: string
}

export const fetchFleets = (signal?: AbortSignal) =>
  apiRequest<ResourceCollection<Fleet>>('/api/fleets', { signal })

export const fleetsQueryOptions = () =>
  queryOptions({
    queryKey: ['fleets'],
    queryFn: ({ signal }) => fetchFleets(signal),
    staleTime: Infinity,
  })
