import type { Dish } from "./types";
import { getRecipe, type Recipe, type RecipeIngredient } from "@/lib/architecture/recipes";
import { FIXTURES } from "./library";

const AISLE: Record<Dish["ingredients"][number]["aisle"], RecipeIngredient["aisle"]> = {
  produce: "produce",
  protein: "protein",
  dairy: "dairy-eggs",
  pantry: "pantry",
  bakery: "bakery",
  frozen: "frozen",
  drinks: "beverages",
  "non-food": "other",
};

function difficulty(dish: Dish): Recipe["difficulty"] {
  if (dish.activeMin >= 35 || dish.ovenMin >= 90) return "involved";
  if (dish.activeMin >= 20 || dish.ovenMin >= 40) return "moderate";
  return "easy";
}

function stepsFor(dish: Dish): string[] {
  const steps: string[] = [];
  steps.push(`Read the whole method before you shop. This is a planning recipe for ${dish.name.toLowerCase()}, not a certified kitchen test.`);
  if (dish.makeAheadDays > 0) {
    steps.push(
      `This dish can be completed up to ${dish.makeAheadDays} day${dish.makeAheadDays === 1 ? "" : "s"} ahead. Cold storage is the real limit — do not make it ahead if the fridge is already tight.`,
    );
  }
  if (dish.method === "raw" || dish.method === "chill") {
    steps.push("No heat. Assemble from cold ingredients. Keep covered until service.");
  } else if (dish.method === "grill") {
    steps.push("Use the declared outdoor heat. If no grill was declared, this dish should not be on the route — the engine fails closed.");
    steps.push("Season, cook to the stated doneness, rest, then slice.");
  } else if (dish.method === "roast" || dish.method === "bake") {
    steps.push(`Oven occupancy is about ${dish.ovenMin} minutes per batch. Do not start this tray if the day-of oven window is already full.`);
    steps.push("Season, tray up, roast, rest. Hold only as long as the fixture hold time.");
  } else if (dish.method === "braise") {
    steps.push("Brown, deglaze, cover, and cook low. Overnight rest improves the sauce. Reheat in its own liquor.");
  } else if (dish.method === "fry") {
    steps.push(`Stovetop occupancy is about ${dish.burnerMin} minutes per batch. One pan, do not crowd.`);
  } else {
    steps.push(`Stovetop occupancy is about ${dish.burnerMin} minutes per batch. Bring to a simmer, finish, hold covered.`);
  }
  steps.push(
    dish.holdMin < 20
      ? `Hold time is short (${dish.holdMin} min). Finish close to service. Do not guess a longer hold.`
      : `Holds about ${dish.holdMin} minutes once finished. After that, quality drops — do not invent extra time.`,
  );
  if (dish.winePairing) steps.push(`Drink pairing: ${dish.winePairing}`);
  if (dish.leftoverNote) steps.push(`Leftover route: ${dish.leftoverNote}`);
  steps.push("Confirm every ingredient and every allergen yourself. Dietary tags are planning filters, not safety guarantees.");
  return steps;
}

function equipmentFor(dish: Dish): string[] {
  const eq: string[] = [];
  if (dish.ovenMin > 0) eq.push("Oven");
  if (dish.burnerMin > 0) eq.push("Stovetop");
  if (dish.grill) eq.push("Grill");
  if (dish.fridgeUnits > 0) eq.push("Cold storage");
  if (dish.counter > 0) eq.push("Landing space");
  if (eq.length === 0) eq.push("Board and knife");
  return eq;
}

/** Build a planning recipe from a first-party fixture dish. */
export function planningRecipeFromDish(dish: Dish): Recipe {
  const head = [dish.note, dish.pairingWhy, dish.winePairing].filter(Boolean).join(" ");
  return {
    dishId: dish.id,
    yield: `Planning yield · ${dish.servesPerBatch} per batch`,
    activeMinutes: dish.activeMin,
    totalMinutes: dish.activeMin + dish.ovenMin + Math.round(dish.burnerMin * 0.35),
    difficulty: difficulty(dish),
    headnote: head || "Educational planning recipe generated from the fixture. Not a certified kitchen test.",
    ingredients: dish.ingredients.map((line) => ({
      item: line.item,
      amount: `${line.perGuest} ${line.unit} per guest`,
      aisle: AISLE[line.aisle],
    })),
    steps: stepsFor(dish),
    makeAhead:
      dish.makeAheadDays === 0
        ? "Day-of only. Do not make this ahead and invent a hold."
        : `Can be completed up to ${dish.makeAheadDays} day${dish.makeAheadDays === 1 ? "" : "s"} ahead. Fridge units: ${dish.fridgeUnits} per batch.`,
    equipment: equipmentFor(dish),
    dietary: dish.contains.map((c) => `contains ${c}`),
    scalingNote: `Scale by ${dish.servesPerBatch}-portion batches. Leftovers goal changes batch volume; it does not change the method.`,
  };
}

/**
 * Architecture recipes win when filed. Every other fixture still gets a
 * planning card so Serve never goes blank.
 */
export function resolvePlanningRecipe(dishId: string, dish?: Dish | null): Recipe | undefined {
  const filed = getRecipe(dishId);
  if (filed) return filed;
  const source = dish ?? FIXTURES.find((d) => d.id === dishId);
  if (!source) return undefined;
  return planningRecipeFromDish(source);
}

export function hasPlanningRecipe(dishId: string): boolean {
  return Boolean(getRecipe(dishId) || FIXTURES.some((d) => d.id === dishId));
}
