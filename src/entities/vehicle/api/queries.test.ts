import { describe, expect, it } from 'vitest'
import { createTestQueryClient, sprinter01, sprinter02, stubApi } from '@/shared/test'
import { storeSavedVehicle, vehicleKeys, vehicleQueryOptions } from './queries'

describe('vehicleQueryOptions', () => {
  it('starts from the list cache, so the edit form needs no extra request', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(vehicleKeys.list(), { items: [sprinter01, sprinter02], total: 2 })
    const { initialData } = vehicleQueryOptions(sprinter02.id, queryClient)

    expect(typeof initialData === 'function' && initialData()).toEqual(sprinter02)
  })

  it('fetches the vehicle when the list is not cached', async () => {
    const { requests } = stubApi()
    const queryClient = createTestQueryClient()

    await expect(
      queryClient.fetchQuery(vehicleQueryOptions(sprinter01.id, queryClient)),
    ).resolves.toEqual(sprinter01)
    expect(requests.map(({ path }) => path)).toEqual([`/api/vehicles/${sprinter01.id}`])
  })
})

describe('storeSavedVehicle', () => {
  it('replaces the vehicle in the detail and the list cache', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(vehicleKeys.list(), { items: [sprinter01, sprinter02], total: 2 })
    const saved = { ...sprinter01, name: 'Sprinter 01 – chłodnia' }

    storeSavedVehicle(queryClient, saved)

    expect(queryClient.getQueryData(vehicleKeys.detail(sprinter01.id))).toEqual(saved)
    expect(queryClient.getQueryData(vehicleKeys.list())).toEqual({
      items: [saved, sprinter02],
      total: 2,
    })
  })

  it('leaves an empty list cache empty', () => {
    const queryClient = createTestQueryClient()

    storeSavedVehicle(queryClient, sprinter01)

    expect(queryClient.getQueryData(vehicleKeys.list())).toBeUndefined()
  })
})
