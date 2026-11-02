import type { ReactNode } from 'react'
import { cx } from '@/shared/lib'
import styles from './Badge.module.css'

export type BadgeTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral'

interface BadgeProps {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}

export const Badge = ({ tone = 'neutral', className, children }: BadgeProps) => (
  <span className={cx(styles.badge, styles[tone], className)}>
    <span className={styles.dot} aria-hidden="true" />
    {children}
  </span>
)
