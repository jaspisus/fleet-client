import { cx } from '@/shared/lib'
import { isVehicleType, type VehicleType } from '../model/types'
import { useVehicleLabels } from '../lib/labels'
import carIcon from './icons/car.svg'
import smallRigidTruckIcon from './icons/smallRigidTruck.svg'
import tractorTrailerIcon from './icons/tractorTrailer.svg'
import unknownIcon from './icons/unknown.svg'
import vanIcon from './icons/van.svg'
import styles from './VehicleTypeIcon.module.css'

const ICONS: Record<VehicleType, string> = {
  Unknown: unknownIcon,
  Car: carIcon,
  Van: vanIcon,
  SmallRigidTruck: smallRigidTruckIcon,
  TractorTrailer: tractorTrailerIcon,
}

interface VehicleTypeIconProps {
  type: VehicleType
  className?: string
}

export const VehicleTypeIcon = ({ type, className }: VehicleTypeIconProps) => {
  const labels = useVehicleLabels()
  const label = labels.vehicleType(type)
  const icon = ICONS[isVehicleType(type) ? type : 'Unknown']

  return (
    <span
      className={cx(styles.icon, className)}
      style={{ maskImage: `url("${icon}")` }}
      role="img"
      aria-label={label}
      title={label}
    />
  )
}
