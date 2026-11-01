import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/shared/test'
import { AppHeader } from './AppHeader'

describe('AppHeader', () => {
  it('links to both views and the language switch', async () => {
    renderWithProviders(<AppHeader />, { path: '/map' })

    const nav = await screen.findByRole('navigation', { name: 'Nawigacja główna' })
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Pojazdy' }))
    expect(screen.getByRole('link', { name: 'Mapa na żywo' })).toHaveAttribute('href', '/map')
    expect(screen.getByRole('link', { name: 'Mapa na żywo' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('group', { name: 'Język interfejsu' })).toBeInTheDocument()
  })
})
