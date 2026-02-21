import { useState, useEffect, useCallback } from 'react'
import MealTypeSelector from './components/MealTypeSelector'
import ImageUpload from './components/ImageUpload'
import AnalysisResults from './components/AnalysisResults'
import DailySummary from './components/DailySummary'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { analyseFood } from './services/api'
import {
  saveMeal,
  getTodaysMeals,
  getTodaySummary,
  deleteMeal,
} from './services/storage'
import { getGoals, GOAL_DEFAULTS } from './services/preferences'
import History from './pages/History'
import ProfileMenu from './components/ProfileMenu'
import { CameraIcon, BarChartIcon, ClockIcon, UtensilsIcon } from './components/Icons'

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const { user, loading, isRecovery, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center font-sketch">
        <span className="inline-block w-6 h-6 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
      </div>
    )
  }

  if (isRecovery) {
    return <ResetPasswordForm />
  }

  if (!user) {
    return <Login />
  }

  return <MainApp user={user} signOut={signOut} />
}

function ResetPasswordForm() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setSubmitting(true)
    setError(null)
    try {
      await updatePassword(password)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center font-sketch px-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-ink">Set new password</h1>
          <p className="text-sm text-ink-light mt-1">Enter your new password below.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 6 chars)"
            required
            minLength={6}
            className="w-full px-3 py-2.5 rounded-md border-2 border-ink-faint bg-card text-ink font-sketch text-sm focus:border-ink outline-none"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            required
            minLength={6}
            className="w-full px-3 py-2.5 rounded-md border-2 border-ink-faint bg-card text-ink font-sketch text-sm focus:border-ink outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-md text-base font-bold bg-ink text-cream border-2 border-ink active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
        {error && (
          <div className="border-2 border-dashed border-ink-faint rounded-md px-4 py-3">
            <p className="text-sm text-ink">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MainApp({ user, signOut }) {
  const [screen, setScreen] = useState('log')
  const [weekStartDay, setWeekStartDay] = useState(1)
  const [goals, setGoals] = useState({ ...GOAL_DEFAULTS })
  const [mealType, setMealType] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [meals, setMeals] = useState([])
  const [summary, setSummary] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealCount: 0,
  })

  const refreshData = useCallback(async () => {
    const todaysMeals = await getTodaysMeals()
    setMeals(todaysMeals)
    const todaysSummary = await getTodaySummary()
    setSummary(todaysSummary)
  }, [])

  useEffect(() => {
    refreshData()
    getGoals().then(setGoals)
  }, [refreshData])

  const handleAnalyse = async () => {
    if (!mealType || !imageBase64) return
    setIsAnalysing(true)
    setError(null)
    setResults(null)

    try {
      const data = await analyseFood(imageBase64, mealType)
      setResults(data)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsAnalysing(false)
    }
  }

  const handleSave = async () => {
    if (!results || !mealType) return
    await saveMeal({
      mealType,
      foods: results.foods,
      totals: results.totals,
      confidence: results.confidence,
      notes: results.notes,
    })
    setMealType(null)
    setImageBase64(null)
    setResults(null)
    setError(null)
    await refreshData()
    setScreen('summary')
  }

  const handleDiscard = () => {
    setResults(null)
    setError(null)
  }

  const handleDeleteMeal = async (id) => {
    await deleteMeal(id)
    await refreshData()
  }

  const handleTabChange = async (newScreen) => {
    setScreen(newScreen)
    if (newScreen === 'summary') await refreshData()
  }

  const canAnalyse = mealType && imageBase64 && !isAnalysing && !results

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sketch">
      {/* Header */}
      <header className="px-4 py-4 sticky top-0 z-10 bg-cream">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <UtensilsIcon className="w-5 h-5 text-ink" />
          <h1 className="text-lg font-bold text-ink">CalorieTracker</h1>
          <div className="ml-auto">
            <ProfileMenu onWeekStartChange={setWeekStartDay} onGoalsChange={setGoals} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 pb-24">
        {screen === 'log' && (
          <div className="space-y-5">
            <section>
              <h2 className="text-xl font-bold text-ink mb-3">
                What meal is this?
              </h2>
              <MealTypeSelector selected={mealType} onSelect={setMealType} />
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">
                Snap your food
              </h2>
              <ImageUpload
                onImageReady={setImageBase64}
                disabled={isAnalysing}
              />
            </section>

            {!results && (
              <button
                onClick={handleAnalyse}
                disabled={!canAnalyse}
                className={`w-full py-3 rounded-md text-base font-bold transition-all ${
                  canAnalyse
                    ? 'bg-accent text-ink hover:bg-accent-hover border-2 border-ink active:scale-[0.98]'
                    : 'bg-cream-dark text-ink-faint border-2 border-ink-faint cursor-not-allowed'
                }`}
              >
                {isAnalysing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                    Analysing your food...
                  </span>
                ) : (
                  'Analyse →'
                )}
              </button>
            )}

            {error && (
              <div className="border-2 border-dashed border-ink-faint rounded-md px-4 py-3">
                <p className="text-sm text-ink">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm font-bold text-ink-light underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {results && (
              <AnalysisResults
                results={results}
                mealType={mealType}
                onSave={handleSave}
                onDiscard={handleDiscard}
              />
            )}
          </div>
        )}

        {screen === 'summary' && (
          <DailySummary
            meals={meals}
            summary={summary}
            onDeleteMeal={handleDeleteMeal}
            goals={goals}
          />
        )}

        {screen === 'history' && (
          <History weekStartDay={weekStartDay} />
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-cream border-t-2 border-ink-faint z-10">
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => handleTabChange('log')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-sm font-bold transition-colors ${
              screen === 'log'
                ? 'text-ink'
                : 'text-ink-faint hover:text-ink-light'
            }`}
          >
            <CameraIcon className="w-5 h-5" />
            <span>Log Meal</span>
          </button>
          <button
            onClick={() => handleTabChange('summary')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-sm font-bold transition-colors ${
              screen === 'summary'
                ? 'text-ink'
                : 'text-ink-faint hover:text-ink-light'
            }`}
          >
            <BarChartIcon className="w-5 h-5" />
            <span>Today</span>
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-sm font-bold transition-colors ${
              screen === 'history'
                ? 'text-ink'
                : 'text-ink-faint hover:text-ink-light'
            }`}
          >
            <ClockIcon className="w-5 h-5" />
            <span>History</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default App
