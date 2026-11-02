import { useTranslation } from 'react-i18next'
import { Badge, Button, VisuallyHidden, type BadgeTone } from '@/shared/ui'
import type { ConnectionStatus } from '../model/liveTrackClient'
import styles from './ConnectionIndicator.module.css'

const STATUS_TONES: Record<ConnectionStatus, BadgeTone> = {
  connecting: 'neutral',
  live: 'success',
  reconnecting: 'warning',
  disconnected: 'danger',
}

interface ConnectionIndicatorProps {
  status: ConnectionStatus
  onReconnect: () => void
}

export const ConnectionIndicator = ({ status, onReconnect }: ConnectionIndicatorProps) => {
  const { t } = useTranslation()
  const label = t(`map.connection.${status}`)

  return (
    <div className={styles.indicator}>
      <span role="status">
        <VisuallyHidden>{t('map.connectionLabel', { status: label })}</VisuallyHidden>
        <span aria-hidden="true">
          <Badge tone={STATUS_TONES[status]}>{label}</Badge>
        </span>
      </span>
      {status === 'disconnected' && (
        <Button size="sm" onClick={onReconnect}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
