import { supabase } from '../lib/supabase'

function getTodayDateString() {
  return new Date().toISOString().split('T')[0]
}

export async function saveMeal(meal) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data, error } = await supabase.from('meals').insert({
    user_id: user.id,
    date: getTodayDateString(),
    meal_type: meal.mealType,
    foods: meal.foods,
    total_calories: meal.totals.calories,
    total_protein: meal.totals.protein,
    total_carbs: meal.totals.carbs,
    total_fat: meal.totals.fat,
    confidence: meal.confidence || null,
    notes: meal.notes || null,
  }).select().single()

  if (error) throw error
  return data
}

export async function getTodaysMeals() {
  const today = getTodayDateString()

  const { data, error } = await supabase
    .from('meals')
    .select()
    .eq('date', today)
    .order('created_at', { ascending: true })

  if (error) throw error

  // Map to the shape the UI components expect
  return data.map(row => ({
    id: row.id,
    timestamp: row.created_at,
    mealType: row.meal_type,
    foods: row.foods,
    totals: {
      calories: row.total_calories,
      protein: row.total_protein,
      carbs: row.total_carbs,
      fat: row.total_fat,
    },
  }))
}

export async function deleteMeal(id) {
  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getTodaySummary() {
  const meals = await getTodaysMeals()

  const summary = meals.reduce(
    (acc, meal) => {
      acc.totalCalories += meal.totals?.calories || 0
      acc.totalProtein += meal.totals?.protein || 0
      acc.totalCarbs += meal.totals?.carbs || 0
      acc.totalFat += meal.totals?.fat || 0
      return acc
    },
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  )

  return {
    ...summary,
    mealCount: meals.length,
  }
}
