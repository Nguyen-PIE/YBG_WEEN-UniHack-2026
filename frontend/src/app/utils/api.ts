const API_BASE_URL = "http://localhost:8000";

export async function generateRecipe(budget: number, servings: number, calories: number) {
  const response = await fetch(`${API_BASE_URL}/generate-recipe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      budget: budget,
      servings: servings,
      target_calories: calories,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to cook up a recipe");
  }

  return response.json();
}