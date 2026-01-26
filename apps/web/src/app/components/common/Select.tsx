import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import './Select.css'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  testId?: string
}

export const Select = ({
  options,
  value,
  onChange,
  label,
  placeholder = '请选择...',
  testId
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, isOpen])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
        e.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(options.findIndex((opt) => opt.value === value))
        return
      }

      switch (e.key) {
        case 'Escape':
          setIsOpen(false)
          break
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1))
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (highlightedIndex >= 0) {
            onChange(options[highlightedIndex].value)
            setIsOpen(false)
          }
          break
      }
    },
    [isOpen, highlightedIndex, options, onChange, value]
  )

  return (
    <div className="select-wrapper" ref={containerRef} data-testid={testId}>
      {label && <label className="select-label">{label}</label>}
      <div
        className={`select-trigger ${isOpen ? 'select-open' : ''}`}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className={selectedOption ? 'select-value' : 'select-placeholder'}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="select-arrow">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      {isOpen && (
        <ul className="select-menu" role="listbox" ref={listRef}>
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={`select-option ${option.value === value ? 'selected' : ''} ${
                index === highlightedIndex ? 'highlighted' : ''
              }`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
