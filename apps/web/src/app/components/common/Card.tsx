import type { HTMLAttributes, ReactNode } from 'react'
import './Card.css'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode
  footer?: ReactNode
  children?: ReactNode
}

export const Card = ({
  header,
  footer,
  children,
  className = '',
  ...rest
}: CardProps) => {
  return (
    <div className={`card ${className}`} {...rest}>
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}

