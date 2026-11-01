import { queryOptions, type QueryClient } from '@tanstack/react-query'
import type { ResourceCollection } from '@/shared/api'
import type { Vehicle } from '../model/types'
import { fetchVehicle, fetchVehicleDictionaries, fetchVehicles } from './vehicleApi'

export const vehicleKeys = {
  all: ['vehicles'] as const,
  list: () => [...vehicleKeys.all, 'list'] as const,
  detail: (id: string) => [...vehicleKeys.all, 'detail', id] as const,
  dictionaries: () => ['vehicle-dictionaries'] as const,
}

export const vehiclesQueryOptions = () =>
  queryOptions({
    queryKey: vehicleKeys.list(),
    queryFn: ({ signal }) => fetchVehicles(signal),
  })

/**
 * Seeds the detail from the list cache, so opening the edit dialog from the table shows the form
 * at once; it still refetches in the background once the list data is stale.
 */
export const vehicleQueryOptions = (id: string, queryClient: QueryClient) =>
  queryOptions({
    queryKey: vehicleKeys.detail(id),
    queryFn: ({ signal }) => fetchVehicle(id, signal),
    initialData: () =>
      queryClient
        .getQueryData<ResourceCollection<Vehicle>>(vehicleKeys.list())
        ?.items.find((vehicle) => vehicle.id === id),
    initialDataUpdatedAt: () => queryClient.getQueryState(vehicleKeys.list())?.dataUpdatedAt,
  })

/** Dictionaries are fixed lists, so they are fetched once per session. */
export const vehicleDictionariesQueryOptions = () =>
  queryOptions({
    queryKey: vehicleKeys.dictionaries(),
    queryFn: ({ signal }) => fetchVehicleDictionaries(signal),
    staleTime: Infinity,
  })

/** Puts a saved vehicle into both the detail and the list cache without refetching. */
export const storeSavedVehicle = (queryClient: QueryClient, saved: Vehicle) => {
  queryClient.setQueryData(vehicleKeys.detail(saved.id), saved)
  queryClient.setQueryData<ResourceCollection<Vehicle>>(vehicleKeys.list(), (current) =>
    current
      ? {
          ...current,
          items: current.items.map((vehicle) => (vehicle.id === saved.id ? saved : vehicle)),
        }
      : current,
  )
}
