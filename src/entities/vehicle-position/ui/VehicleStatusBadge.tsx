import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/ui'
import { STATUS_BADGE_TONES, type VehicleStatus } from '../model/status'

export const VehicleStatusBadge = ({ status }: { status: VehicleStatus }) => {
  const { t } = useTranslation()
  return <Badge tone={STATUS_BADGE_TONES[status]}>{t(`map.status.${status}`)}</Badge>
}
