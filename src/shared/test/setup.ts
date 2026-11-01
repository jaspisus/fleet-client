import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { DEFAULT_LANGUAGE, i18n } from '@/shared/i18n'

vi.mock('zustand')

// jsdom has no modal dialogs. This shim covers what the app uses; real behaviour (focus trap,
// inert page, Esc) is covered by the Playwright tests.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    // Browsers fire `close` asynchronously, too.
    setTimeout(() => this.dispatchEvent(new Event('close')))
  }
}
if (!Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'open')) {
  Object.defineProperty(HTMLDialogElement.prototype, 'open', {
    get(this: HTMLDialogElement) {
      return this.hasAttribute('open')
    },
  })
}

Element.prototype.scrollIntoView ??= function scrollIntoView() {}

beforeEach(async () => {
  localStorage.clear()
  await i18n.changeLanguage(DEFAULT_LANGUAGE)
})

afterEach(() => {
  cleanup()
})
