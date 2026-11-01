import { useTranslation } from 'react-i18next'
import { changeLanguage, isLanguage, LANGUAGES } from '@/shared/i18n'
import { VisuallyHidden } from '@/shared/ui'
import styles from './LanguageSwitcher.module.css'

export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation()
  const current = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : undefined

  return (
    <div role="group" aria-label={t('language.label')} className={styles.switcher}>
      {LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          className={styles.option}
          aria-pressed={current === language}
          onClick={() => void changeLanguage(language)}
        >
          {language.toUpperCase()}
          <VisuallyHidden lang={language}> – {t(`language.${language}`)}</VisuallyHidden>
        </button>
      ))}
    </div>
  )
}
