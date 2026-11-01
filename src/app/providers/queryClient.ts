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
        // A save is not repeated behind the user's back; they decide whether to try again.
        retry: false,
      },
    },
  })
