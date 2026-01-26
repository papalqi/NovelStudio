import type { InputHTMLAttributes } from 'react'
import './Input.css'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  wrapperClassName?: string
}

export const Input = ({
  label,
  error,
  id,
  className = '',
  wrapperClassName = '',
  ...rest
}: InputProps) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`input-wrapper ${wrapperClassName} ${error ? 'input-has-error' : ''}`}>
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-field ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  )
}

