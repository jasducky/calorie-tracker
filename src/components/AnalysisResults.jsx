import { MEAL_ICONS, UtensilsIcon } from './Icons'

function ConfidenceBadge({ confidence }) {
  const level = confidence?.toLowerCase() || 'medium'
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border-2 border-ink-faint text-ink-light">
      {level.charAt(0).toUpperCase() + level.slice(1)} confidence
    </span>
  )
}

export default function AnalysisResults({
  results,
  mealType,
  onSave,
  onDiscard,
}) {
  if (!results) return null

  const { foods = [], totals = {}, confidence, notes } = results

  return (
    <div className="bg-card rounded-md border-2 border-ink overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-dashed border-ink-faint flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(() => { const Icon = MEAL_ICONS[mealType] || UtensilsIcon; return <Icon className="w-5 h-5 text-ink" /> })()}
          <h3 className="font-bold text-ink">Analysis Results</h3>
        </div>
        {confidence && <ConfidenceBadge confidence={confidence} />}
      </div>

      {/* Food items */}
      <div className="divide-y divide-dashed divide-ink-faint">
        {foods.map((food, index) => (
          <div key={index} className="px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-ink">{food.name}</span>
              {food.quantity && (
                <span className="text-xs text-ink-faint">{food.quantity}</span>
              )}
            </div>
            <div className="flex gap-3 text-xs text-ink-light">
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

      {/* Totals */}
      <div className="px-4 py-3 bg-cream-dark border-t-2 border-ink-faint">
        <div className="flex items-center justify-between">
          <span className="font-bold text-ink">Total</span>
          <span className="font-bold text-ink">
            {totals.calories} kcal
          </span>
        </div>
        <div className="flex gap-4 mt-1 text-xs text-ink-light">
          <span>Protein: {totals.protein}g</span>
          <span>Carbs: {totals.carbs}g</span>
          <span>Fat: {totals.fat}g</span>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="px-4 py-3 border-t border-dashed border-ink-faint">
          <p className="text-xs text-ink-light italic">{notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t-2 border-ink-faint flex gap-3">
        <button
          onClick={onDiscard}
          className="flex-1 px-4 py-2.5 rounded-md text-sm font-bold text-ink-light border-2 border-ink-faint hover:border-ink hover:text-ink transition-colors"
        >
          Discard
        </button>
        <button
          onClick={onSave}
          className="flex-1 px-4 py-2.5 rounded-md text-sm font-bold text-ink bg-accent border-2 border-ink hover:bg-accent-hover transition-colors"
        >
          Save to Log
        </button>
      </div>
    </div>
  )
}
