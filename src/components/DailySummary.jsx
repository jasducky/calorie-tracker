import MealCard from './MealCard'
import { calcMacroGrams, GOAL_DEFAULTS } from '../services/preferences'

function MacroBar({ label, value, max }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-ink-light w-16">{label}</span>
      <div className="flex-1 h-2.5 bg-cream-dark rounded-full overflow-hidden border border-ink-faint">
        <div
          className="h-full bg-ink rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-bold text-ink w-16 text-right">
        {Math.round(value)}g / {max}g
      </span>
    </div>
  )
}

export default function DailySummary({ meals, summary, onDeleteMeal, goals = GOAL_DEFAULTS }) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const calorieTarget = goals.calorie_target
  const { proteinG, carbsG, fatG } = calcMacroGrams(
    goals.calorie_target, goals.protein_pct, goals.carbs_pct, goals.fat_pct
  )

  const caloriePercentage = Math.min(
    (summary.totalCalories / calorieTarget) * 100,
    100
  )

  const circumference = 2 * Math.PI * 54
  const strokeDashoffset =
    circumference - (caloriePercentage / 100) * circumference

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-sm font-bold text-ink-light">{today}</h2>
      </div>

      <div className="bg-card rounded-md border-2 border-ink p-6">
        <div className="flex flex-col items-center">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#f0ece5"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={caloriePercentage >= 100 ? '#E8D44D' : '#1b1b1b'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-ink">
                {Math.round(summary.totalCalories)}
              </span>
              <span className="text-xs text-ink-faint">
                / {calorieTarget} kcal
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-ink-light">
            {Math.round(caloriePercentage)}% of daily target
          </p>
        </div>

        <div className="mt-5 space-y-2.5">
          <MacroBar label="Protein" value={summary.totalProtein} max={proteinG} />
          <MacroBar label="Carbs" value={summary.totalCarbs} max={carbsG} />
          <MacroBar label="Fat" value={summary.totalFat} max={fatG} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-ink-light mb-2">
          Today's Meals ({summary.mealCount})
        </h3>
        {meals.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-ink-faint rounded-md">
            <p className="text-ink-light text-sm">No meals logged yet today.</p>
            <p className="mt-1 text-ink-faint text-xs">
              Tap "Log Meal" to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onDelete={onDeleteMeal} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
