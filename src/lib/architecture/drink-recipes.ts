/** Drink planning recipes for Architecture beverage route. Educational — not kitchen certification. */

import type { Recipe } from "./recipes";

function r(
  dishId: string,
  yieldText: string,
  activeMinutes: number,
  totalMinutes: number,
  difficulty: Recipe["difficulty"],
  headnote: string,
  ingredients: Recipe["ingredients"],
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

export const DRINK_RECIPES: Record<string, Recipe> = {
  "drink-zero": r(
    "drink-zero",
    "Serves 12 as equal-status house pour",
    20,
    20,
    "easy",
    "The zero-proof peer that must read as intentional, not a consolation. Acid, bitterness, aroma, dilution, and temperature — not sweetness alone.",
    [
      { item: "Chilled sparkling water or soda", amount: "3 liters", aisle: "beverages" },
      { item: "Fresh citrus (lemon, lime, or grapefruit)", amount: "4", aisle: "produce" },
      { item: "Bitters or non-alcoholic bitter aperitif", amount: "4 oz", aisle: "beverages" },
      { item: "Simple syrup or honey syrup", amount: "½ cup", aisle: "pantry" },
      { item: "Fresh herb (rosemary, thyme, or mint)", amount: "1 small bunch", aisle: "produce" },
      { item: "Ice", amount: "plenty", aisle: "other" },
    ],
    [
      "Chill the sparkling base fully — warm bubbles read as an afterthought.",
      "Build in a pitcher: juice of 2 citrus, syrup, bitters, then top with sparkling water.",
      "Taste for acid and bitterness before service; adjust so it stands next to any wine or spirit pour.",
      "Garnish glasses with citrus peel and herb. Keep a second pitcher cold so the Equal never runs dry.",
    ],
    "Base mix (juice, syrup, bitters) up to 1 day ahead. Add sparkling water and ice at service.",
    ["Pitcher", "Citrus juicer", "Ice bucket"],
    ["vegetarian", "vegan", "gluten_free"],
    "About 8–10 oz finished pour per guest when this is the Equal.",
  ),
};
