import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { i18n, LANGUAGE_STORAGE_KEY } from '@/shared/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'

describe('LanguageSwitcher', () => {
  it('switches the language and marks the current one', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>,
    )
    const group = screen.getByRole('group', { name: 'Język interfejsu' })
    expect(screen.getByRole('button', { name: /PL.*Polski/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await userEvent.click(screen.getByRole('button', { name: /EN.*English/ }))

    expect(group).toHaveAccessibleName('Interface language')
    expect(screen.getByRole('button', { name: /EN.*English/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })
})
