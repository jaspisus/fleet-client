import {
  createRootRouteWithContext,
  createRoute,
  lazyRouteComponent,
  redirect,
  useMatch,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { driversQueryOptions } from '@/entities/driver'
import { fleetsQueryOptions } from '@/entities/fleet'
import {
  vehicleDictionariesQueryOptions,
  vehicleQueryOptions,
  vehiclesQueryOptions,
} from '@/entities/vehicle'
import { NotFoundPage, RouteErrorPage } from '@/pages/errors'
import { VehicleEditDialog } from '@/pages/vehicle-edit'
import { VehiclesPage, type VehiclesSearch } from '@/pages/vehicles'
import { LoadingState } from '@/shared/ui'
import { AppLayout } from '../layout/AppLayout'

export interface RouterContext {
  queryClient: QueryClient
}

// Search params are parsed as JSON, so `?q=123` arrives as a number.
const optionalText = (value: unknown) =>
  (typeof value === 'string' || typeof value === 'number') && value !== ''
    ? String(value)
    : undefined

export const parseVehiclesSearch = (search: Record<string, unknown>): VehiclesSearch => ({
  q: optionalText(search.q),
  sort: optionalText(search.sort),
})

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: AppLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteErrorPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/vehicles', replace: true })
  },
})

const vehiclesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'vehicles',
  validateSearch: parseVehiclesSearch,
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(vehiclesQueryOptions())
  },
  component: function VehiclesRouteComponent() {
    const search = vehiclesRoute.useSearch()
    const navigate = vehiclesRoute.useNavigate()
    return (
      <VehiclesPage
        search={search}
        onSearchChange={(next) => void navigate({ search: next, replace: true })}
      />
    )
  },
})

const vehicleRoute = createRoute({
  getParentRoute: () => vehiclesRoute,
  path: '$vehicleId',
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(vehicleQueryOptions(params.vehicleId, queryClient))
    void queryClient.prefetchQuery(vehicleDictionariesQueryOptions())
    void queryClient.prefetchQuery(fleetsQueryOptions())
    void queryClient.prefetchQuery(driversQueryOptions())
  },
  component: function VehicleRouteComponent() {
    const { vehicleId } = vehicleRoute.useParams()
    const navigate = vehicleRoute.useNavigate()
    const router = useRouter()
    const isEditing = useMatch({ from: vehicleEditRoute.id, shouldThrow: false }) !== undefined
    // Edit opened from details pushed a history entry, so Save and Cancel go back to details.
    // Edit opened directly (the table, a deep link) closes the dialog instead.
    const [openedInDetails] = useState(!isEditing)
    const close = () => void navigate({ to: '/vehicles', search: true })
    return (
      <VehicleEditDialog
        vehicleId={vehicleId}
        mode={isEditing ? 'edit' : 'view'}
        onClose={close}
        onEdit={() =>
          void navigate({ to: '/vehicles/$vehicleId/edit', params: { vehicleId }, search: true })
        }
        onEditEnd={openedInDetails ? () => router.history.back() : undefined}
      />
    )
  },
})

const vehicleDetailsRoute = createRoute({
  getParentRoute: () => vehicleRoute,
  path: '/',
})

const vehicleEditRoute = createRoute({
  getParentRoute: () => vehicleRoute,
  path: 'edit',
})

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'map',
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(vehiclesQueryOptions())
  },
  component: lazyRouteComponent(() => import('@/pages/live-map'), 'LiveMapPage'),
  pendingComponent: LoadingState,
})

export const routeTree = rootRoute.addChildren([
  indexRoute,
  vehiclesRoute.addChildren([vehicleRoute.addChildren([vehicleDetailsRoute, vehicleEditRoute])]),
  mapRoute,
])
