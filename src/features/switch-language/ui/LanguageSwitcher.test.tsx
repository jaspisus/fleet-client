import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { i18n, LANGUAGE_STORAGE_KEY } from '@/shared/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'

const renderSwitcher = () => {
  const user = userEvent.setup()
  render(
    <I18nextProvider i18n={i18n}>
      <LanguageSwitcher />
    </I18nextProvider>,
  )
  return { user, combobox: screen.getByRole('combobox', { name: 'Język interfejsu' }) }
}

const activeOption = (combobox: HTMLElement) =>
  document.getElementById(combobox.getAttribute('aria-activedescendant') ?? '')

describe('LanguageSwitcher', () => {
  it('shows the current language and keeps the list closed', () => {
    const { combobox } = renderSwitcher()

    expect(combobox).toHaveTextContent('Polski')
    expect(combobox).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('switches the language with the mouse', async () => {
    const { user, combobox } = renderSwitcher()

    await user.click(combobox)
    expect(combobox).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('option', { name: 'Polski' })).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('option', { name: 'English' }))

    expect(combobox).toHaveAccessibleName('Interface language')
    expect(combobox).toHaveTextContent('English')
    expect(combobox).toHaveAttribute('aria-expanded', 'false')
    expect(combobox).toHaveFocus()
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('switches the language with the keyboard', async () => {
    const { user, combobox } = renderSwitcher()
    await user.tab()
    expect(combobox).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(combobox).toHaveAttribute('aria-expanded', 'true')
    expect(activeOption(combobox)).toHaveTextContent('Polski')

    await user.keyboard('{End}')
    expect(activeOption(combobox)).toHaveTextContent('English')
    await user.keyboard('{Home}')
    expect(activeOption(combobox)).toHaveTextContent('Polski')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(activeOption(combobox)).toHaveTextContent('English')

    await user.keyboard('{Enter}')

    expect(combobox).toHaveAttribute('aria-expanded', 'false')
    expect(combobox).not.toHaveAttribute('aria-activedescendant')
    expect(document.documentElement.lang).toBe('en')
  })

  it('closes without changing the language on Escape or blur', async () => {
    const { user, combobox } = renderSwitcher()
    await user.tab()

    await user.keyboard('{ArrowDown}{ArrowDown}{Escape}')
    expect(combobox).toHaveAttribute('aria-expanded', 'false')

    await user.keyboard(' ')
    expect(combobox).toHaveAttribute('aria-expanded', 'true')
    await user.tab()

    expect(combobox).toHaveAttribute('aria-expanded', 'false')
    expect(document.documentElement.lang).toBe('pl')
  })
})
