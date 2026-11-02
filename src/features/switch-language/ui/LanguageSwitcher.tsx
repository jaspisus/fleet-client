import { type KeyboardEvent, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  changeLanguage,
  DEFAULT_LANGUAGE,
  getLanguageFlag,
  getLanguageName,
  isLanguage,
  type Language,
  LANGUAGES,
} from '@/shared/i18n'
import { cx } from '@/shared/lib'
import styles from './LanguageSwitcher.module.css'

const LAST_INDEX = LANGUAGES.length - 1

const LanguageLabel = ({ language }: { language: Language }) => (
  <>
    <img className={styles.flag} src={getLanguageFlag(language)} alt="" width={20} height={15} />
    <span lang={language}>{getLanguageName(language)}</span>
  </>
)

export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation()
  const current = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const id = useId()
  const listboxId = `${id}-listbox`
  const optionId = (language: Language) => `${id}-${language}`

  const openList = () => {
    setActiveIndex(LANGUAGES.indexOf(current))
    setOpen(true)
  }

  const select = (language: Language) => {
    setOpen(false)
    if (language !== current) void changeLanguage(language)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        openList()
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        setActiveIndex((index) => Math.min(index + 1, LAST_INDEX))
        break
      case 'ArrowUp':
        setActiveIndex((index) => Math.max(index - 1, 0))
        break
      case 'Home':
        setActiveIndex(0)
        break
      case 'End':
        setActiveIndex(LAST_INDEX)
        break
      case 'Enter':
      case ' ':
        select(LANGUAGES[activeIndex] ?? current)
        break
      case 'Escape':
        setOpen(false)
        break
      case 'Tab':
        // Let focus move on; blur closes the list.
        return
      default:
        return
    }
    event.preventDefault()
  }

  return (
    <div className={styles.root}>
      <div
        role="combobox"
        tabIndex={0}
        className={styles.trigger}
        aria-label={t('language.label')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? optionId(LANGUAGES[activeIndex] ?? current) : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        onBlur={() => setOpen(false)}
      >
        <LanguageLabel language={current} />
        <span className={styles.chevron} aria-hidden="true" />
      </div>
      <ul
        id={listboxId}
        role="listbox"
        aria-label={t('language.label')}
        className={styles.listbox}
        hidden={!open}
        // Keep focus on the trigger while an option is clicked.
        onMouseDown={(event) => event.preventDefault()}
      >
        {LANGUAGES.map((language, index) => (
          <li
            key={language}
            id={optionId(language)}
            role="option"
            aria-selected={language === current}
            className={cx(styles.option, index === activeIndex && styles.active)}
            onMouseMove={() => setActiveIndex(index)}
            onClick={() => select(language)}
          >
            <LanguageLabel language={language} />
          </li>
        ))}
      </ul>
    </div>
  )
}
