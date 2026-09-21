import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'

export default function SelectField({ label, value, options, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState(null)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null)
      return undefined
    }
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      setMenuPosition({ top: rect.bottom + 7, left: rect.left, width: rect.width })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  const menu = open && <div ref={menuRef} className="select-menu" role="listbox" aria-label={label} style={menuPosition ? { position: 'fixed', top: menuPosition.top, left: menuPosition.left, width: menuPosition.width, right: 'auto', zIndex: 500 } : undefined}>{options.map((option) => <button type="button" role="option" aria-selected={option === value} className={option === value ? 'selected' : ''} key={option} onClick={() => { onChange(option); setOpen(false) }}>{option}{option === value && <span className="select-check">✓</span>}</button>)}</div>
  return <div className={`select-field ${open ? 'open' : ''} ${className}`} ref={rootRef}><span className="select-label">{label}</span><button ref={triggerRef} type="button" className="select-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}><strong>{value}</strong><Icon name="chevron" size={16} /></button>{menu && createPortal(menu, document.body)}</div>
}
