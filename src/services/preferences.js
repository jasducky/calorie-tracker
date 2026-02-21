import { supabase } from '../lib/supabase'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const WEEK_START_OPTIONS = DAY_NAMES.map((name, index) => ({ value: index, label: name }))

export const GOAL_DEFAULTS = {
  calorie_target: 2000,
  protein_pct: 30,
  carbs_pct: 40,
  fat_pct: 30,
}

export function calcMacroGrams(calorieTarget, proteinPct, carbsPct, fatPct) {
  return {
    proteinG: Math.round((calorieTarget * (proteinPct / 100)) / 4),
    carbsG: Math.round((calorieTarget * (carbsPct / 100)) / 4),
    fatG: Math.round((calorieTarget * (fatPct / 100)) / 9),
  }
}

export async function getGoals() {
  const { data } = await supabase
    .from('user_preferences')
    .select('calorie_target, protein_pct, carbs_pct, fat_pct')
    .single()

  return {
    calorie_target: data?.calorie_target ?? GOAL_DEFAULTS.calorie_target,
    protein_pct: data?.protein_pct ?? GOAL_DEFAULTS.protein_pct,
    carbs_pct: data?.carbs_pct ?? GOAL_DEFAULTS.carbs_pct,
    fat_pct: data?.fat_pct ?? GOAL_DEFAULTS.fat_pct,
  }
}

export async function setGoals(goals) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      calorie_target: goals.calorie_target,
      protein_pct: goals.protein_pct,
      carbs_pct: goals.carbs_pct,
      fat_pct: goals.fat_pct,
    })

  if (error) throw error
}

export async function getWeekStartDay() {
  const { data } = await supabase
    .from('user_preferences')
    .select('week_start_day')
    .single()

  // Default to Monday (1) if no preference set
  return data?.week_start_day ?? 1
}

export async function setWeekStartDay(day) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, week_start_day: day })

  if (error) throw error
}
