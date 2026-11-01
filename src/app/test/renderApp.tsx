import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient } from '@/shared/test'
import { App } from '../App'
import { createAppRouter } from '../router/router'

/** Renders the whole app (real routes, layout and pages) at the given URL. */
export const renderApp = (path: string) => {
  const queryClient = createTestQueryClient()
  const router = createAppRouter(queryClient, createMemoryHistory({ initialEntries: [path] }))
  const user = userEvent.setup()
  const result = render(<App queryClient={queryClient} router={router} />)
  return { ...result, user, router, queryClient }
}
