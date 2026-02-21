import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  WEEK_START_OPTIONS, getWeekStartDay, setWeekStartDay,
  GOAL_DEFAULTS, getGoals, setGoals, calcMacroGrams,
} from '../services/preferences'

export default function ProfileMenu({ onWeekStartChange, onGoalsChange }) {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [weekStart, setWeekStart] = useState(1)
  const [goalsOpen, setGoalsOpen] = useState(false)
  const [goalForm, setGoalForm] = useState({ ...GOAL_DEFAULTS })
  const [saving, setSaving] = useState(false)
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

  const openGoalsModal = async () => {
    const current = await getGoals()
    setGoalForm(current)
    setGoalsOpen(true)
    setOpen(false)
  }

  const pctSum = goalForm.protein_pct + goalForm.carbs_pct + goalForm.fat_pct
  const macroGrams = calcMacroGrams(goalForm.calorie_target, goalForm.protein_pct, goalForm.carbs_pct, goalForm.fat_pct)

  const handleGoalsSave = async () => {
    if (pctSum !== 100) return
    setSaving(true)
    try {
      await setGoals(goalForm)
      if (onGoalsChange) onGoalsChange(goalForm)
      setGoalsOpen(false)
    } finally {
      setSaving(false)
    }
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

          {/* Daily Goals */}
          <div className="px-4 py-3 border-b-2 border-dashed border-ink-faint">
            <button
              onClick={openGoalsModal}
              className="w-full text-sm font-bold text-ink-light hover:text-ink transition-colors text-left"
            >
              Daily Goals
            </button>
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

      {/* Daily Goals Modal */}
      {goalsOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setGoalsOpen(false)}>
          <div className="bg-card border-2 border-ink rounded-md shadow-lg w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-ink">Daily Goals</h3>

            {/* Calorie target */}
            <div>
              <label className="text-xs font-bold text-ink-light block mb-1">Calorie target (kcal)</label>
              <input
                type="number"
                min="500"
                max="10000"
                value={goalForm.calorie_target}
                onChange={e => setGoalForm(f => ({ ...f, calorie_target: parseInt(e.target.value) || 0 }))}
                className="w-full text-sm bg-cream border-2 border-ink-faint rounded-md px-3 py-2 text-ink font-sketch focus:border-ink outline-none"
              />
            </div>

            {/* Macro split */}
            <div>
              <label className="text-xs font-bold text-ink-light block mb-1">Macro split (%)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'protein_pct', label: 'Protein', gram: macroGrams.proteinG },
                  { key: 'carbs_pct', label: 'Carbs', gram: macroGrams.carbsG },
                  { key: 'fat_pct', label: 'Fat', gram: macroGrams.fatG },
                ].map(m => (
                  <div key={m.key}>
                    <label className="text-xs text-ink-light block mb-0.5">{m.label}</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={goalForm[m.key]}
                      onChange={e => setGoalForm(f => ({ ...f, [m.key]: parseInt(e.target.value) || 0 }))}
                      className="w-full text-sm bg-cream border-2 border-ink-faint rounded-md px-2 py-1.5 text-ink font-sketch focus:border-ink outline-none"
                    />
                    <span className="text-xs text-ink-faint">= {m.gram}g</span>
                  </div>
                ))}
              </div>
              {pctSum !== 100 && (
                <p className="text-xs text-red-600 mt-1">
                  Percentages must add to 100% (currently {pctSum}%)
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setGoalForm({ ...GOAL_DEFAULTS })}
                className="text-xs font-bold text-ink-light underline hover:text-ink"
              >
                Restore defaults
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setGoalsOpen(false)}
                  className="px-3 py-1.5 text-sm font-bold text-ink-light hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGoalsSave}
                  disabled={pctSum !== 100 || saving}
                  className="px-4 py-1.5 text-sm font-bold bg-ink text-cream rounded-md border-2 border-ink disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
