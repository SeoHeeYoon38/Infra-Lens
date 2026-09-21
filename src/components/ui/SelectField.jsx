import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

export default function SelectField({ label, value, options, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return <div className={`select-field ${open ? 'open' : ''} ${className}`} ref={rootRef}><span className="select-label">{label}</span><button type="button" className="select-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}><strong>{value}</strong><Icon name="chevron" size={16} /></button>{open && <div className="select-menu" role="listbox" aria-label={label}>{options.map((option) => <button type="button" role="option" aria-selected={option === value} className={option === value ? 'selected' : ''} key={option} onClick={() => { onChange(option); setOpen(false) }}>{option}{option === value && <span className="select-check">✓</span>}</button>)}</div>}</div>
}
