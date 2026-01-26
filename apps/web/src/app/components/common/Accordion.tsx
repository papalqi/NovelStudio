import { useState, useRef, useEffect, type ReactNode } from 'react'
import './Accordion.css'

export interface AccordionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

export const Accordion = ({
  title,
  defaultOpen = false,
  children
}: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [height, setHeight] = useState<number | undefined>(
    defaultOpen ? undefined : 0
  )
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return

    if (isOpen) {
      const contentHeight = contentRef.current.scrollHeight
      setHeight(contentHeight)
      // After animation, set to auto for dynamic content
      const timer = setTimeout(() => setHeight(undefined), 200)
      return () => clearTimeout(timer)
    } else {
      // First set current height, then animate to 0
      setHeight(contentRef.current.scrollHeight)
      requestAnimationFrame(() => {
        setHeight(0)
      })
    }
  }, [isOpen])

  return (
    <div className={`accordion ${isOpen ? 'accordion-open' : ''}`}>
      <button
        type="button"
        className="accordion-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="accordion-title">{title}</span>
        <span className="accordion-icon">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div
        ref={contentRef}
        className="accordion-content"
        style={{ height: height !== undefined ? `${height}px` : 'auto' }}
      >
        <div className="accordion-body">{children}</div>
      </div>
    </div>
  )
}

