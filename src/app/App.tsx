import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import type { createAppRouter } from './router/router'

interface AppProps {
  queryClient: QueryClient
  router: ReturnType<typeof createAppRouter>
}

export const App = ({ queryClient, router }: AppProps) => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </I18nextProvider>
)
