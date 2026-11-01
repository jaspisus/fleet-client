import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib'
import styles from './Layout.module.css'

/** Centres content and caps its width at `--container-max`, with the responsive side gutter. */
export const Container = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cx(styles.container, className)} {...props} />
)

export const VisuallyHidden = ({ className, ...props }: ComponentProps<'span'>) => (
  <span className={cx(styles.visuallyHidden, className)} {...props} />
)
