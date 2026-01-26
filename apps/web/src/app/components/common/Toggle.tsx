import type { InputHTMLAttributes } from 'react'
import './Toggle.css'

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Toggle = ({
  label,
  id,
  checked,
  disabled,
  className = '',
  ...rest
}: ToggleProps) => {
  const toggleId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <label
      className={`toggle-wrapper ${disabled ? 'toggle-disabled' : ''} ${className}`}
      htmlFor={toggleId}
    >
      <div className="toggle-track">
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          disabled={disabled}
          className="toggle-input"
          {...rest}
        />
        <span className="toggle-thumb" />
      </div>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  )
}

