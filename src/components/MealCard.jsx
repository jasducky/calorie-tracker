import { useState } from 'react'
import { MEAL_ICONS, UtensilsIcon } from './Icons'

export default function MealCard({ meal, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const time = new Date(meal.timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const mealLabel =
    meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)
  const foodCount = meal.foods?.length || 0

  const handleDelete = () => {
    if (confirmingDelete) {
      onDelete(meal.id)
    } else {
      setConfirmingDelete(true)
      setTimeout(() => setConfirmingDelete(false), 3000)
    }
  }

  return (
    <div className="bg-card rounded-md border-2 border-ink-faint overflow-hidden hover:border-ink transition-colors">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {(() => { const Icon = MEAL_ICONS[meal.mealType] || UtensilsIcon; return <Icon className="w-5 h-5 text-ink" /> })()}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink">{mealLabel}</span>
              <span className="text-xs text-ink-faint">{time}</span>
            </div>
            <span className="text-xs text-ink-light">
              {foodCount} {foodCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-ink text-sm">
            {meal.totals?.calories || 0} kcal
          </span>
          <span
            className={`text-ink-faint text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </div>
      </div>

      {expanded && (
        <div className="border-t-2 border-dashed border-ink-faint">
          <div className="divide-y divide-dashed divide-ink-faint">
            {meal.foods?.map((food, index) => (
              <div
                key={index}
                className="px-4 py-2 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm text-ink">{food.name}</span>
                  {food.quantity && (
                    <span className="text-xs text-ink-faint ml-2">
                      {food.quantity}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 text-xs text-ink-light">
                  <span className="font-bold text-ink">
                    {food.calories} kcal
                  </span>
                  <span>P: {food.protein}g</span>
                  <span>C: {food.carbs}g</span>
                  <span>F: {food.fat}g</span>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2.5 bg-cream-dark border-t-2 border-ink-faint flex items-center justify-between">
            <div className="text-xs text-ink-light">
              <span>P: {meal.totals?.protein || 0}g</span>
              <span className="mx-2">C: {meal.totals?.carbs || 0}g</span>
              <span>F: {meal.totals?.fat || 0}g</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              className={`text-xs font-bold px-3 py-1 rounded-md border-2 transition-colors ${
                confirmingDelete
                  ? 'bg-ink text-cream border-ink'
                  : 'text-ink-light border-ink-faint hover:border-ink hover:text-ink'
              }`}
            >
              {confirmingDelete ? 'Confirm delete?' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
