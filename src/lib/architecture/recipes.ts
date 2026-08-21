/** Planning recipes for every catalog dish. Educational — not kitchen-tested certification. */

import { DRINK_RECIPES } from "./drink-recipes";

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

function r(
  dishId: string,
  yieldText: string,
  activeMinutes: number,
  totalMinutes: number,
  difficulty: Recipe["difficulty"],
  headnote: string,
  ingredients: RecipeIngredient[],
  steps: string[],
  makeAhead: string,
  equipment: string[],
  dietary: string[],
  scalingNote: string,
): Recipe {
  return {
    dishId,
    yield: yieldText,
    activeMinutes,
    totalMinutes,
    difficulty,
    headnote,
    ingredients,
    steps,
    makeAhead,
    equipment,
    dietary,
    scalingNote,
  };
}

export const RECIPES: Record<string, Recipe> = {
  ...DRINK_RECIPES,
};

export function getRecipe(dishId: string): Recipe | undefined {
  return RECIPES[dishId];
}

export function recipesForIds(ids: string[]): Recipe[] {
  return ids.map((id) => RECIPES[id]).filter((r): r is Recipe => Boolean(r));
}

export const RECIPE_COUNT = Object.keys(RECIPES).length;
