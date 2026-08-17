import { aisleLabel } from "@/lib/utils";
import { DISH_CATALOG } from "./catalog";
import { getRecipe, type Recipe, type RecipeIngredient } from "./recipes";
import { PLAN_STASH_KEY, type MenuBuilderInput, type MenuBuilderResult } from "./types";

export type StashedPlan = {
  savedAt: string;
  scenarioId?: string | null;
  input: MenuBuilderInput;
  result: MenuBuilderResult;
};

export type ShoppingLine = RecipeIngredient & { dishName: string };

export type ServicePlan = {
  title: string;
  thesis: string;
  guestCount: number;
  occasion: string;
  serviceStyle: string;
  band: string;
  score: number;
  dishes: Array<{
    role: string;
    id: string;
    name: string;
    blurb: string;
    makeAhead: boolean;
    heat: string;
    hasRecipe: boolean;
  }>;
  timeline: {
    early: string;
    dayBefore: string;
    eventDay: string;
    service: string;
  };
  shopping: Array<{ aisle: string; label: string; items: ShoppingLine[] }>;
  serviceRun: string[];
  recipeCount: number;
};

export function stashPlan(plan: StashedPlan): boolean {
  try {
    sessionStorage.setItem(PLAN_STASH_KEY, JSON.stringify(plan));
    localStorage.setItem(PLAN_STASH_KEY, JSON.stringify(plan));
    return true;
  } catch {
    return false;
  }
}

export function loadStashedPlan(): StashedPlan | null {
  try {
    const raw =
      sessionStorage.getItem(PLAN_STASH_KEY) || localStorage.getItem(PLAN_STASH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StashedPlan;
    if (!parsed?.result || !parsed?.input) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearStashedPlan(): void {
  try {
    sessionStorage.removeItem(PLAN_STASH_KEY);
    localStorage.removeItem(PLAN_STASH_KEY);
  } catch {
    /* ignore */
  }
}

function catalogName(id: string): string {
  const dish = (DISH_CATALOG as Array<{ id: string; name: string }>).find((d) => d.id === id);
  return dish?.name || id;
}

export function buildServicePlan(input: MenuBuilderInput, result: MenuBuilderResult): ServicePlan {
  const dishes = (result.dishPlan || [])
    .filter((block) => block.primary)
    .map((block) => {
      const p = block.primary!;
      return {
        role: block.role,
        id: p.id,
        name: p.name,
        blurb: p.blurb,
        makeAhead: p.makeAhead,
        heat: p.heat,
        hasRecipe: Boolean(getRecipe(p.id)),
      };
    });

  const recipes: Recipe[] = dishes
    .map((d) => getRecipe(d.id))
    .filter((r): r is Recipe => Boolean(r));

  const bucket = new Map<string, ShoppingLine[]>();
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const line: ShoppingLine = { ...ing, dishName: catalogName(recipe.dishId) };
      const list = bucket.get(ing.aisle) || [];
      list.push(line);
      bucket.set(ing.aisle, list);
    }
  }

  const aisleOrder = [
    "produce",
    "protein",
    "dairy-eggs",
    "deli",
    "bakery",
    "pantry",
    "spices",
    "frozen",
    "beverages",
    "other",
  ];

  const shopping = aisleOrder
    .filter((aisle) => bucket.has(aisle))
    .map((aisle) => ({
      aisle,
      label: aisleLabel(aisle),
      items: bucket.get(aisle) || [],
    }));

  const timeline = result.prepTimeline || {
    early: "Shop from the aisle list. Confirm equipment and dietary constraints.",
    dayBefore: "Cook every make-ahead dish. Chill possets, pâtés, pickles, and braises.",
    eventDay: "Roast or grill the day-of anchor. Hold sides. Set the table early.",
    service: "Dress salads last. Pass family-style. Keep the host out of the kitchen after sit-down.",
  };

  const anchor = dishes.find((d) => d.role === "anchor");
  const serviceRun = [
    "Set welcome out 20 minutes before the first guest — room temp, no last heat.",
    anchor
      ? `Anchor (${anchor.name}) should already be holding or in its last cook.`
      : "Confirm the anchor is holding before anyone sits.",
    "Contrast and relief go down together so the plate has both cut and calm.",
    "Finish stays cold or warm off-stage until the table is ready to leave the main.",
    result.beverageDirection || "Keep water and the declared beverage route on the table, not in the kitchen.",
  ];

  return {
    title: `${input.occasion || "Menu"} · ${input.guestCount || "?"} guests`,
    thesis: result.thesis || "A coherent five-role menu for the declared occasion.",
    guestCount: input.guestCount,
    occasion: input.occasion,
    serviceStyle: String(input.serviceStyle),
    band: result.menuStressTest?.band || result.confidence?.band || "workable",
    score: result.menuStressTest?.score || result.confidence?.score || 0,
    dishes,
    timeline,
    shopping,
    serviceRun,
    recipeCount: recipes.length,
  };
}
