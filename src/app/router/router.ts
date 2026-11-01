import { createRouter, type RouterHistory } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { routeTree } from './routes'

export const createAppRouter = (queryClient: QueryClient, history?: RouterHistory) =>
  createRouter({
    routeTree,
    history,
    context: { queryClient },
    defaultPreload: 'intent',
    // TanStack Query owns the data cache; the router must always call loaders to prefetch.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
