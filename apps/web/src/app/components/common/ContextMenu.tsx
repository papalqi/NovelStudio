import { useEffect, useRef, useState } from 'react'
import './ContextMenu.css'

export type MenuItem = {
  id: string
  icon?: React.ReactNode
  label: string
  shortcut?: string
  onClick: () => void
  danger?: boolean
}

export type MenuSeparator = { type: 'separator' }

export type ContextMenuProps = {
  items: (MenuItem | MenuSeparator)[]
  position: { x: number; y: number }
  onClose: () => void
}

function isSeparator(item: MenuItem | MenuSeparator): item is MenuSeparator {
  return 'type' in item && item.type === 'separator'
}

export const ContextMenu = ({ items, position, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  // Adjust position to avoid viewport overflow
  useEffect(() => {
    if (!menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = position.x
    let y = position.y

    // Adjust horizontal position
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 8
    }
    if (x < 8) x = 8

    // Adjust vertical position
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 8
    }
    if (y < 8) y = 8

    setAdjustedPosition({ x, y })
  }, [position])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleItemClick = (item: MenuItem) => {
    item.onClick()
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {items.map((item, index) =>
        isSeparator(item) ? (
          <div key={`sep-${index}`} className="context-menu-separator" />
        ) : (
          <button
            key={item.id}
            className={`context-menu-item${item.danger ? ' danger' : ''}`}
            onClick={() => handleItemClick(item)}
            data-testid={`context-${item.id}`}
          >
            {item.icon && <span className="context-menu-icon">{item.icon}</span>}
            <span className="context-menu-label">{item.label}</span>
            {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
          </button>
        )
      )}
    </div>
  )
}
