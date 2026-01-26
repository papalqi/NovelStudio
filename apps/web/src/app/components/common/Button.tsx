import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'icon'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children?: ReactNode
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}: ButtonProps) => {
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading ? 'btn-loading' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classNames} disabled={disabled || loading} {...rest}>
      {loading && <span className="btn-spinner" />}
      <span className={loading ? 'btn-content-hidden' : ''}>{children}</span>
    </button>
  )
}

