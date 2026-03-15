import type { ProductWithPrices } from '../data/types';

export type { ProductWithPrices };

const API_BASE_URL = "/api";

export interface RecipeIngredient {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  store: string;
  totalPrice: number;
}

export interface RecipeResult {
  recipeMarkdown: string;
  ingredients: RecipeIngredient[];
  totalPrice: number;
}

export async function generateRecipe(
  budget: number,
  servings: number,
  targetCalories: number = 500,
  cuisineStyle?: string,
  mealType?: string,
  duration?: string,
): Promise<RecipeResult> {
  const response = await fetch(`${API_BASE_URL}/generate-recipe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ budget, servings, targetCalories, cuisineStyle, mealType, duration }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "Failed to cook up a recipe");
  return data as RecipeResult;
}

export async function searchProducts(
  query: string,
  size = 40,
): Promise<ProductWithPrices[]> {
  const response = await fetch(`${API_BASE_URL}/search-products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, size }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "Search failed");
  return data.products as ProductWithPrices[];
}
