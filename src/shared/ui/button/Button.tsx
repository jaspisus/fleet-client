import type { ComponentProps } from 'react'
import { buttonClassName, type ButtonStyleOptions } from './buttonClassName'

type ButtonProps = ComponentProps<'button'> & ButtonStyleOptions

export const Button = ({ variant, size, className, type = 'button', ...props }: ButtonProps) => (
  <button type={type} className={buttonClassName({ variant, size, className })} {...props} />
)
