import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDocumentTitle } from '@/shared/lib'
import { Button, buttonClassName, Container } from '@/shared/ui'
import styles from './ErrorPages.module.css'

export const NotFoundPage = () => {
  const { t } = useTranslation()
  useDocumentTitle(t('app.name'), t('notFound.title'))

  return (
    <Container className={styles.page}>
      <h1 className={styles.title}>{t('notFound.title')}</h1>
      <p className={styles.description}>{t('notFound.description')}</p>
      <Link to="/vehicles" className={buttonClassName({ variant: 'primary' })}>
        {t('notFound.action')}
      </Link>
    </Container>
  )
}

export const RouteErrorPage = () => {
  const { t } = useTranslation()

  return (
    <Container className={styles.page} role="alert">
      <h1 className={styles.title}>{t('routeError.title')}</h1>
      <p className={styles.description}>{t('routeError.description')}</p>
      <Button variant="primary" onClick={() => window.location.reload()}>
        {t('routeError.reload')}
      </Button>
    </Container>
  )
}
