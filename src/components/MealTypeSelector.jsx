import { MEAL_ICONS } from './Icons'

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
]

export default function MealTypeSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {MEAL_TYPES.map((type) => {
        const Icon = MEAL_ICONS[type.id]
        return (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`flex flex-col items-center gap-1 rounded-md px-2 py-3 text-sm font-bold transition-all border-2 ${
              selected === type.id
                ? 'bg-accent border-ink text-ink'
                : 'bg-card border-ink-faint text-ink-light hover:border-ink hover:text-ink'
            }`}
          >
            <Icon className="w-6 h-6" />
            <span>{type.label}</span>
          </button>
        )
      })}
    </div>
  )
}
