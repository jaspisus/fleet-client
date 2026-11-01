import {
  createRootRouteWithContext,
  createRoute,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router'
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

// Loaders only start fetching; pages render their own loading states, so navigation is instant
// even with a slow API.
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

const vehicleEditRoute = createRoute({
  getParentRoute: () => vehiclesRoute,
  path: '$vehicleId/edit',
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(vehicleQueryOptions(params.vehicleId, queryClient))
    void queryClient.prefetchQuery(vehicleDictionariesQueryOptions())
    void queryClient.prefetchQuery(fleetsQueryOptions())
    void queryClient.prefetchQuery(driversQueryOptions())
  },
  component: function VehicleEditRouteComponent() {
    const { vehicleId } = vehicleEditRoute.useParams()
    const navigate = vehicleEditRoute.useNavigate()
    return (
      <VehicleEditDialog
        vehicleId={vehicleId}
        onClose={() => void navigate({ to: '/vehicles', search: true })}
      />
    )
  },
})

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'map',
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(vehiclesQueryOptions())
  },
  // MapLibre is large, so the map page is a separate chunk loaded on first visit.
  component: lazyRouteComponent(() => import('@/pages/live-map'), 'LiveMapPage'),
  pendingComponent: LoadingState,
})

export const routeTree = rootRoute.addChildren([
  indexRoute,
  vehiclesRoute.addChildren([vehicleEditRoute]),
  mapRoute,
])
