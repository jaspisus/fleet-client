import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { prefersReducedMotion } from '@/shared/lib'
import styles from './VehiclesLoader.module.css'

const ROUTE = 'M16 92 C64 92 72 28 128 28 S184 92 236 72 S288 24 304 28'

export const LOADER_DURATION_MS = 2200

interface VehiclesLoaderProps {
  loaded: boolean
  onFinish: () => void
}

/**
 * Loading screen of the vehicle list: a vehicle marker drives a route while the trail behind it
 * is drawn. It stays for `LOADER_DURATION_MS` after mount (one arrival) and then until `loaded`,
 * whichever is later; with reduced motion only until `loaded`.
 */
export const VehiclesLoader = ({ loaded, onFinish }: VehiclesLoaderProps) => {
  const { t } = useTranslation()
  const gradientId = useId()
  const [durationElapsed, setDurationElapsed] = useState(prefersReducedMotion)

  useEffect(() => {
    const timeout = setTimeout(() => setDurationElapsed(true), LOADER_DURATION_MS)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (loaded && durationElapsed) onFinish()
  }, [loaded, durationElapsed, onFinish])

  return (
    <div role="status" className={styles.loader}>
      <div className={styles.scene} aria-hidden="true">
        <svg className={styles.map} viewBox="0 0 320 120" focusable="false">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop className={styles.stopTeal} offset="0" />
              <stop className={styles.stopEmber} offset="0.55" />
              <stop className={styles.stopSand} offset="1" />
            </linearGradient>
          </defs>
          <path className={styles.road} d={ROUTE} />
          <path className={styles.trail} d={ROUTE} pathLength={1} stroke={`url(#${gradientId})`} />
          <rect className={styles.depot} x="10" y="86" width="12" height="12" />
          <rect className={styles.destination} x="298" y="22" width="12" height="12" />
        </svg>
        <span className={styles.vehicle} style={{ offsetPath: `path('${ROUTE}')` }} />
      </div>
      <p className={styles.label}>{t('vehicles.loading')}</p>
    </div>
  )
}
