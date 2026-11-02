import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })

const RootOutlet = () => <Outlet />

interface RenderOptions {
  /** Initial URL; the UI is rendered for every path. */
  path?: string
  queryClient?: QueryClient
}

/** Renders UI with Query, i18n and a memory router whose every path shows the UI. */
export const renderWithProviders = (
  ui: ReactNode,
  { path = '/', queryClient = createTestQueryClient() }: RenderOptions = {},
) => {
  const UnderTest = () => ui
  const rootRoute = createRootRoute({ component: RootOutlet })
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: '/', component: UnderTest }),
    createRoute({ getParentRoute: () => rootRoute, path: '$', component: UnderTest }),
  ])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  const user = userEvent.setup()
  const result = render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return { ...result, user, router, queryClient }
}

/** Renders UI with Query and i18n only, for components that do not use the router. */
export const renderWithQuery = (
  ui: ReactNode,
  { queryClient = createTestQueryClient() }: Pick<RenderOptions, 'queryClient'> = {},
) => {
  const user = userEvent.setup()
  const result = render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </I18nextProvider>,
  )
  return { ...result, user, queryClient }
}
