import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import MealCard from '../components/MealCard'
import { deleteMeal } from '../services/storage'

function groupMealsByDate(rows) {
  const grouped = {}
  rows.forEach(row => {
    const date = row.date
    if (!grouped[date]) {
      grouped[date] = {
        date,
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'short'
        }),
        meals: [],
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      }
    }
    grouped[date].meals.push({
      id: row.id,
      timestamp: row.created_at,
      mealType: row.meal_type,
      foods: row.foods,
      totals: {
        calories: row.total_calories,
        protein: row.total_protein,
        carbs: row.total_carbs,
        fat: row.total_fat
      }
    })
    grouped[date].totals.calories += row.total_calories
    grouped[date].totals.protein += row.total_protein
    grouped[date].totals.carbs += row.total_carbs
    grouped[date].totals.fat += row.total_fat
  })
  return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date))
}

// Get the start of the week containing a given date
function getWeekStart(d, startDay = 1) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = (day - startDay + 7) % 7
  date.setDate(date.getDate() - diff)
  return date
}

function formatDateString(d) {
  return d.toISOString().split('T')[0]
}

function getWeekLabel(start) {
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  const opts = { day: 'numeric', month: 'short' }
  const startLabel = start.toLocaleDateString('en-GB', opts)
  const endLabel = end.toLocaleDateString('en-GB', opts)
  return `${startLabel} – ${endLabel}`
}

export default function History({ weekStartDay = 1 }) {
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDate, setExpandedDate] = useState(null)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date(), weekStartDay))
  const [weekTotal, setWeekTotal] = useState(0)
  const [dailyAvg, setDailyAvg] = useState(0)
  const [avgDiff, setAvgDiff] = useState(null)
  const [sortNewestFirst, setSortNewestFirst] = useState(true)

  // Re-calculate week start when preference changes
  useEffect(() => {
    setWeekStart(getWeekStart(new Date(), weekStartDay))
  }, [weekStartDay])

  const fetchWeek = async (start) => {
    setLoading(true)
    setExpandedDate(null)

    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    // Fetch this week and last week in parallel
    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - 7)
    const prevEnd = new Date(prevStart)
    prevEnd.setDate(prevEnd.getDate() + 6)

    const [thisWeekResult, lastWeekResult] = await Promise.all([
      supabase
        .from('meals')
        .select()
        .gte('date', formatDateString(start))
        .lte('date', formatDateString(end))
        .order('date', { ascending: false })
        .order('created_at', { ascending: true }),
      supabase
        .from('meals')
        .select('total_calories, date')
        .gte('date', formatDateString(prevStart))
        .lte('date', formatDateString(prevEnd))
    ])

    if (thisWeekResult.error) {
      console.error('Failed to fetch history:', thisWeekResult.error)
      setDays([])
      setWeekTotal(0)
      setDailyAvg(0)
      setAvgDiff(null)
    } else {
      const grouped = groupMealsByDate(thisWeekResult.data)
      const total = grouped.reduce((sum, day) => sum + day.totals.calories, 0)
      const daysWithMeals = grouped.length || 1
      const avg = Math.round(total / daysWithMeals)

      setDays(grouped)
      setWeekTotal(total)
      setDailyAvg(avg)

      // Calculate last week's average for comparison
      if (!lastWeekResult.error && lastWeekResult.data.length > 0) {
        const lastTotal = lastWeekResult.data.reduce((sum, r) => sum + (r.total_calories || 0), 0)
        const lastDays = new Set(lastWeekResult.data.map(r => r.date)).size || 1
        const lastAvg = Math.round(lastTotal / lastDays)
        setAvgDiff(avg - lastAvg)
      } else {
        setAvgDiff(null)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchWeek(weekStart)
  }, [weekStart])

  const goToPreviousWeek = () => {
    const prev = new Date(weekStart)
    prev.setDate(prev.getDate() - 7)
    setWeekStart(prev)
  }

  const goToNextWeek = () => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + 7)
    // Don't go beyond the current week
    const currentStart = getWeekStart(new Date(), weekStartDay)
    if (next <= currentStart) {
      setWeekStart(next)
    }
  }

  const isCurrentWeek = formatDateString(weekStart) === formatDateString(getWeekStart(new Date(), weekStartDay))

  const handleDelete = async (id) => {
    await deleteMeal(id)
    await fetchWeek(weekStart)
  }

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousWeek}
          className="px-3 py-2 text-ink font-bold hover:bg-cream-dark rounded-md transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <h2 className="text-base font-bold text-ink">
            {isCurrentWeek ? 'This week' : getWeekLabel(weekStart)}
          </h2>
          {!isCurrentWeek && (
            <p className="text-xs text-ink-faint">{getWeekLabel(weekStart)}</p>
          )}
          {weekTotal > 0 && (
            <div className="mt-0.5">
              <p className="text-xs text-ink-light">
                {weekTotal} kcal total · {dailyAvg} kcal/day avg
              </p>
              {avgDiff !== null && avgDiff !== 0 && (
                <p className={`text-xs font-bold ${avgDiff > 0 ? 'text-ink' : 'text-ink-light'}`}>
                  {avgDiff > 0 ? '↑' : '↓'} {Math.abs(avgDiff)} kcal/day vs last week
                </p>
              )}
              {avgDiff === 0 && (
                <p className="text-xs text-ink-light">Same as last week</p>
              )}
            </div>
          )}
        </div>
        <button
          onClick={goToNextWeek}
          disabled={isCurrentWeek}
          className={`px-3 py-2 font-bold rounded-md transition-colors ${
            isCurrentWeek
              ? 'text-ink-faint cursor-not-allowed'
              : 'text-ink hover:bg-cream-dark'
          }`}
        >
          →
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <span className="inline-block w-6 h-6 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && days.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-light">No meals logged this week.</p>
          <p className="text-sm text-ink-faint mt-1">
            {isCurrentWeek ? 'Start by logging your first meal!' : 'Nothing here — try another week.'}
          </p>
        </div>
      )}

      {/* Sort toggle */}
      {!loading && days.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setSortNewestFirst(!sortNewestFirst)}
            className="text-xs text-ink-light hover:text-ink transition-colors flex items-center gap-1"
          >
            {sortNewestFirst ? 'Newest first ↓' : 'Oldest first ↑'}
          </button>
        </div>
      )}

      {/* Day cards */}
      {!loading && (sortNewestFirst ? days : [...days].reverse()).map((day) => (
        <div key={day.date} className="bg-card rounded-md border-2 border-ink-faint overflow-hidden">
          <button
            onClick={() => setExpandedDate(expandedDate === day.date ? null : day.date)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-cream-dark transition-colors"
          >
            <div>
              <span className="font-bold text-ink">{day.label}</span>
              <span className="text-xs text-ink-light ml-2">
                {day.meals.length} {day.meals.length === 1 ? 'meal' : 'meals'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-ink text-sm">
                {day.totals.calories} kcal
              </span>
              <span className={`text-ink-faint text-xs transition-transform ${expandedDate === day.date ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </button>

          {expandedDate === day.date && (
            <div className="border-t-2 border-dashed border-ink-faint px-3 py-3 space-y-2 bg-cream">
              <div className="flex justify-between text-xs text-ink-light px-1 mb-2">
                <span>P: {day.totals.protein}g</span>
                <span>C: {day.totals.carbs}g</span>
                <span>F: {day.totals.fat}g</span>
              </div>
              {day.meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
