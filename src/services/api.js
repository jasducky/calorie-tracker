const WEBHOOK_URL = 'https://n8n.serpin.ai/webhook/calorie-tracker'

export async function analyseFood(imageBase64, mealType) {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageBase64,
      mealType,
      timestamp: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`)
  }

  const json = await response.json()

  // Handle multiple response shapes from n8n agent
  const data = json.output || json.data || json
  const foods = data.food || data.foods || data.detectedFoods || []

  // Calculate totals client-side (more reliable than LLM arithmetic)
  const totals = foods.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fat: acc.fat + (item.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return {
    foods,
    totals,
    confidence: data.confidence || 'medium',
    notes: data.notes || null,
  }
}
