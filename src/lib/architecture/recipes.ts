/** Planning recipes for every catalog dish. Educational — not kitchen-tested certification. */

import { DRINK_RECIPES } from "./drink-recipes";
import { FOOD_RECIPES } from "./food-recipes";

export type RecipeIngredient = {
  item: string;
  amount: string;
  aisle: "produce" | "pantry" | "dairy-eggs" | "bakery" | "protein" | "spices" | "frozen" | "deli" | "beverages" | "other";
};

export type Recipe = {
  dishId: string;
  yield: string;
  activeMinutes: number;
  totalMinutes: number;
  difficulty: "easy" | "moderate" | "involved";
  headnote: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  makeAhead: string;
  equipment: string[];
  dietary: string[];
  scalingNote: string;
};

export const RECIPES: Record<string, Recipe> = {
  ...FOOD_RECIPES,
  ...DRINK_RECIPES,
};

export function getRecipe(dishId: string): Recipe | undefined {
  return RECIPES[dishId];
}

export function recipesForIds(ids: string[]): Recipe[] {
  return ids.map((id) => RECIPES[id]).filter((r): r is Recipe => Boolean(r));
}

export const RECIPE_COUNT = Object.keys(RECIPES).length;
