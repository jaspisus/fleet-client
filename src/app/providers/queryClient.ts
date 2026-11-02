import { QueryClient } from '@tanstack/react-query'
import { shouldRetryRequest } from '@/shared/api'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetryRequest,
      },
      mutations: {
        retry: false,
      },
    },
  })
