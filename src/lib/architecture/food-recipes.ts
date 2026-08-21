/** Food planning recipes. Educational — not kitchen certification. */

import type { Recipe } from "./recipes";
import { FOOD_RECIPES_A } from "./food-recipes-a";
import { FOOD_RECIPES_B } from "./food-recipes-b";

export const FOOD_RECIPES: Record<string, Recipe> = {
  ...FOOD_RECIPES_A,
  ...FOOD_RECIPES_B,
};
