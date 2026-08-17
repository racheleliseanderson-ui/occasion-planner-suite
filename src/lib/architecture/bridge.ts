/**
 * Map Architecture catalog dishes onto Occasion OS Dish records
 * so Plan can score the actual menu decision instead of picking a new one.
 */
import type { Dish, Course } from "@/lib/oos/types";
import { DISH_CATALOG } from "./catalog";
import { getRecipe } from "./recipes";

const ROLE_TO_COURSE: Record<string, Course> = {
  welcome: "board",
  anchor: "anchor",
  contrast: "starter",
  relief: "side",
  finish: "sweet",
};

type ArchDish = {
  id: string;
  role?: string;
  name?: string;
  blurb?: string;
  makeAhead?: boolean;
  heat?: string;
  equipment?: string[];
  dietary?: string[];
};

function containsFromDietary(dietary: string[] = [], name = ""): Dish["contains"] {
  const out: Dish["contains"] = [];
  const blob = `${dietary.join(" ")} ${name}`.toLowerCase();
  if (/\bmeat|beef|pork|lamb|chicken|rib\b/.test(blob) && !dietary.includes("vegetarian") && !dietary.includes("vegan")) {
    out.push("meat");
  }
  if (/\bpork\b/.test(blob)) out.push("pork");
  if (/\bfish|salmon|cod\b/.test(blob)) out.push("fish");
  if (/\bshellfish|shrimp|prawn\b/.test(blob)) out.push("shellfish");
  if (dietary.includes("vegetarian") === false && /\bdairy|feta|cheese|butter|cream\b/.test(blob)) out.push("dairy");
  if (/\bgluten|bread|pasta|cake|pastry\b/.test(blob) && !dietary.includes("gluten_free")) out.push("gluten");
  if (/\bnut|almond|walnut|pecan\b/.test(blob)) out.push("nut");
  if (/\begg\b/.test(blob)) out.push("egg");
  if (/\bwine|alcohol\b/.test(blob)) out.push("alcohol");
  if (dietary.includes("vegan")) return out.filter((c) => !["meat", "pork", "fish", "shellfish", "dairy", "egg"].includes(c));
  return out;
}

export function architectureDishToOos(raw: ArchDish): Dish {
  const recipe = getRecipe(raw.id);
  const heat = String(raw.heat || "none");
  const equipment = raw.equipment || [];
  const usesOven = equipment.some((e) => /oven/.test(e)) || heat === "high";
  const usesBurner = equipment.some((e) => /stove|skillet|pot/.test(e)) || heat === "medium" || heat === "low";
  const course = ROLE_TO_COURSE[String(raw.role)] ?? "side";
  return {
    id: raw.id,
    name: raw.name || raw.id,
    course,
    note: raw.blurb || "",
    contains: containsFromDietary(raw.dietary, raw.name),
    formats: ["seated", "buffet", "grazing"],
    shapes: ["dinner", "brunch", "reception"],
    ovenMin: usesOven ? (course === "anchor" ? 90 : 35) : 0,
    burnerMin: usesBurner ? (course === "anchor" ? 25 : 12) : 0,
    fridgeUnits: raw.makeAhead ? 1 : 0.5,
    counter: course === "anchor" ? 2 : 1,
    activeMin: recipe?.activeMinutes ?? (course === "anchor" ? 35 : 15),
    servesPerBatch: 8,
    makeAheadDays: raw.makeAhead ? 1 : 0,
    holdMin: raw.makeAhead ? 90 : 40,
    ingredients: (recipe?.ingredients ?? []).slice(0, 8).map((line) => ({
      item: line.item,
      perGuest: 1,
      unit: "portion",
      aisle: line.aisle === "dairy-eggs" ? "dairy" : line.aisle === "spices" || line.aisle === "other" ? "pantry" : line.aisle === "deli" ? "protein" : line.aisle === "beverages" ? "drinks" : (line.aisle as Dish["ingredients"][number]["aisle"]),
    })),
    season: ["year-round"],
    costPerGuest: course === "anchor" ? 6 : 2,
    method: usesOven ? "roast" : usesBurner ? "boil" : "raw",
    tempBand: usesOven || usesBurner ? "hot" : "cold",
    cuisine: "house",
  };
}

export function overlayFromDishIds(ids: string[]): Dish[] {
  const catalog = DISH_CATALOG as ArchDish[];
  const byId = new Map(catalog.map((d) => [d.id, d] as const));
  return ids
    .map((id) => byId.get(id))
    .filter((d): d is ArchDish => Boolean(d))
    .map(architectureDishToOos);
}

export function catalogName(id: string): string | undefined {
  const hit = (DISH_CATALOG as ArchDish[]).find((d) => d.id === id);
  return hit?.name;
}
