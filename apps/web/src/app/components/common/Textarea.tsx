import type { TextareaHTMLAttributes } from 'react'
import './Textarea.css'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  wrapperClassName?: string
}

export const Textarea = ({
  label,
  error,
  id,
  className = '',
  wrapperClassName = '',
  ...rest
}: TextareaProps) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`textarea-wrapper ${wrapperClassName} ${error ? 'textarea-has-error' : ''}`}>
      {label && (
        <label className="textarea-label" htmlFor={textareaId}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`textarea-field ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
      {error && <span className="textarea-error">{error}</span>}
    </div>
  )
}
