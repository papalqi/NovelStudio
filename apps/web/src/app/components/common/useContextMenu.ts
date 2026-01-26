import { useState, useCallback } from 'react'

type Position = { x: number; y: number }

type UseContextMenuReturn = {
  isOpen: boolean
  position: Position
  openMenu: (event: React.MouseEvent) => void
  closeMenu: () => void
}

export const useContextMenu = (): UseContextMenuReturn => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })

  const openMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setPosition({ x: event.clientX, y: event.clientY })
    setIsOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    position,
    openMenu,
    closeMenu,
  }
}

