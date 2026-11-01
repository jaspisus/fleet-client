import { Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/widgets/app-header'
import { Toaster } from '@/shared/ui'
import styles from './AppLayout.module.css'

export const AppLayout = () => {
  const { t } = useTranslation()

  return (
    <>
      <a href="#main-content" className={styles.skipLink}>
        {t('app.skipToContent')}
      </a>
      <AppHeader />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <Toaster />
    </>
  )
}
