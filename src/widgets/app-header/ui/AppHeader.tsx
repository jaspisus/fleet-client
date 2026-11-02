import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/features/switch-language'
import { Container } from '@/shared/ui'
import styles from './AppHeader.module.css'

const ACTIVE_LINK_PROPS = { className: styles.active }

export const AppHeader = () => {
  const { t } = useTranslation()

  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <Link to="/vehicles" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true" />
          {t('app.name')}
        </Link>
        <nav aria-label={t('nav.label')} className={styles.nav}>
          <Link to="/vehicles" className={styles.navLink} activeProps={ACTIVE_LINK_PROPS}>
            {t('nav.vehicles')}
          </Link>
          <Link to="/map" className={styles.navLink} activeProps={ACTIVE_LINK_PROPS}>
            {t('nav.map')}
          </Link>
        </nav>
        <div className={styles.language}>
          <LanguageSwitcher />
        </div>
      </Container>
    </header>
  )
}
