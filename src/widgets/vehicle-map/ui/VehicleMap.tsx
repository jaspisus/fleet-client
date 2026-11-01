import { useTranslation } from 'react-i18next'
import { VehicleMapCanvas, type VehicleMapCanvasProps } from './VehicleMapCanvas'
import styles from './VehicleMap.module.css'

export const VehicleMap = (props: VehicleMapCanvasProps) => {
  const { t } = useTranslation()
  return (
    <div role="region" aria-label={t('map.mapLabel')} className={styles.map}>
      <VehicleMapCanvas {...props} />
    </div>
  )
}
