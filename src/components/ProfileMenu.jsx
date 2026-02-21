import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { WEEK_START_OPTIONS, getWeekStartDay, setWeekStartDay } from '../services/preferences'

export default function ProfileMenu({ onWeekStartChange }) {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [weekStart, setWeekStart] = useState(1)
  const menuRef = useRef(null)

  useEffect(() => {
    getWeekStartDay().then(setWeekStart)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleWeekStartChange = async (e) => {
    const day = parseInt(e.target.value)
    setWeekStart(day)
    await setWeekStartDay(day)
    if (onWeekStartChange) onWeekStartChange(day)
  }

  const initials = user.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.[0]?.toUpperCase() || '?'

  const displayName = user.user_metadata?.full_name || 'User'
  const email = user.email || ''

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-cream border-2 border-ink flex items-center justify-center text-xs font-bold text-ink hover:bg-cream-dark transition-colors"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-64 bg-card border-2 border-ink rounded-md shadow-lg z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b-2 border-dashed border-ink-faint">
            <p className="font-bold text-ink text-sm">{displayName}</p>
            <p className="text-xs text-ink-light truncate">{email}</p>
          </div>

          {/* Settings */}
          <div className="px-4 py-3 border-b-2 border-dashed border-ink-faint">
            <label className="text-xs font-bold text-ink-light block mb-1.5">
              Week starts on
            </label>
            <select
              value={weekStart}
              onChange={handleWeekStartChange}
              className="w-full text-sm bg-cream border-2 border-ink-faint rounded-md px-2 py-1.5 text-ink font-sketch focus:border-ink outline-none"
            >
              {WEEK_START_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Sign out */}
          <div className="px-4 py-3">
            <button
              onClick={signOut}
              className="w-full text-sm font-bold text-ink-light hover:text-ink transition-colors text-left"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
