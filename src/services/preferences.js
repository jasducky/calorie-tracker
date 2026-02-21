import { supabase } from '../lib/supabase'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const WEEK_START_OPTIONS = DAY_NAMES.map((name, index) => ({ value: index, label: name }))

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
