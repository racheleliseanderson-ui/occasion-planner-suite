import { useSyncExternalStore } from "react";
import { z } from "zod";
import type { Conditions, Dish, Kitchen } from "./types";

/**
 * Client-side configuration store.
 * Everything the host personalises — dish overrides, custom dishes, hidden
 * fixtures, kitchen profiles and saved scenarios — lives in localStorage and
 * travels as a single portable JSON file. No backend, no account, no upload.
 */

const KEY = "oos-config-v1";

const aisle = z.enum(["produce", "protein", "dairy", "pantry", "bakery", "frozen", "drinks", "non-food"]);
const course = z.enum(["board", "starter", "anchor", "side", "bread", "sweet", "drink"]);
const contains = z.enum(["meat", "pork", "fish", "shellfish", "dairy", "gluten", "nut", "egg", "alcohol"]);
const style = z.enum(["seated", "buffet", "grazing", "cocktail"]);
const shape = z.enum(["dinner", "brunch", "reception", "cookout", "aperitivo"]);
const season = z.enum(["spring", "summer", "autumn", "winter", "year-round"]);
const method = z.enum(["roast", "braise", "fry", "boil", "grill", "raw", "bake", "chill"]);
const tempBand = z.enum(["cold", "ambient", "warm", "hot"]);

const ingredientSchema = z.object({
  item: z.string().trim().min(1).max(80),
  perGuest: z.number().min(0).max(10),
  unit: z.string().trim().min(1).max(12),
  aisle,
});

export const dishSchema = z.object({
  id: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(80),
  course,
  note: z.string().trim().max(240),
  contains: z.array(contains),
  formats: z.array(style),
  shapes: z.array(shape),
  ovenMin: z.number().min(0).max(600),
  burnerMin: z.number().min(0).max(600),
  grill: z.boolean().optional(),
  fridgeUnits: z.number().min(0).max(12),
  counter: z.number().min(0).max(3),
  activeMin: z.number().min(0).max(300),
  servesPerBatch: z.number().min(1).max(60),
  makeAheadDays: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  holdMin: z.number().min(0).max(600),
  ingredients: z.array(ingredientSchema).max(30),
  season: z.array(season).optional(),
  costPerGuest: z.number().min(0).max(200).optional(),
  method: method.optional(),
  tempBand: tempBand.optional(),
  kidFriendly: z.boolean().optional(),
  outdoorSafe: z.boolean().optional(),
});

const kitchenSchema = z.object({
  ovens: z.number().min(0).max(4),
  burners: z.number().min(0).max(8),
  grill: z.boolean(),
  dishwasher: z.boolean(),
  fridge: z.enum(["tight", "normal", "roomy"]),
  counter: z.enum(["small", "medium", "large"]),
  seats: z.number().min(0).max(60),
});

const scenarioSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(60),
  note: z.string().trim().max(120).default(""),
  conditions: z.record(z.string(), z.unknown()),
});

const profileSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(60),
  kitchen: kitchenSchema,
});

export const configSchema = z.object({
  version: z.literal(1).default(1),
  customDishes: z.array(dishSchema).max(400).default([]),
  dishOverrides: z.record(z.string(), dishSchema.partial()).default({}),
  hiddenDishIds: z.array(z.string()).default([]),
  kitchenProfiles: z.array(profileSchema).max(30).default([]),
  savedScenarios: z.array(scenarioSchema).max(40).default([]),
});

export type OosConfig = z.infer<typeof configSchema>;
export type KitchenProfile = z.infer<typeof profileSchema>;
export type SavedScenario = z.infer<typeof scenarioSchema>;

export const EMPTY_CONFIG: OosConfig = {
  version: 1,
  customDishes: [],
  dishOverrides: {},
  hiddenDishIds: [],
  kitchenProfiles: [],
  savedScenarios: [],
};

let current: OosConfig = EMPTY_CONFIG;
let loaded = false;
const listeners = new Set<() => void>();

function read(): OosConfig {
  if (typeof window === "undefined") return EMPTY_CONFIG;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_CONFIG;
    const parsed = configSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_CONFIG;
  } catch {
    return EMPTY_CONFIG;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    current = read();
    loaded = true;
  }
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot(): OosConfig {
  ensureLoaded();
  return current;
}

export function writeConfig(next: OosConfig) {
  current = next;
  loaded = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the session still works, it just will not persist */
  }
  emit();
}

export function updateConfig(fn: (c: OosConfig) => OosConfig) {
  writeConfig(fn(snapshot()));
}

/** Reactive read. Server render always sees the untouched fixture config. */
export function useConfig(): OosConfig {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY_CONFIG);
}

// ---- mutations ----------------------------------------------------------

export function saveDish(dish: Dish, isFixture: boolean) {
  updateConfig((c) =>
    isFixture
      ? { ...c, dishOverrides: { ...c.dishOverrides, [dish.id]: dish } }
      : {
          ...c,
          customDishes: [...c.customDishes.filter((d) => d.id !== dish.id), dish as OosConfig["customDishes"][number]],
        },
  );
}

export function resetDish(id: string) {
  updateConfig((c) => {
    const next = { ...c.dishOverrides };
    delete next[id];
    return {
      ...c,
      dishOverrides: next,
      customDishes: c.customDishes.filter((d) => d.id !== id),
      hiddenDishIds: c.hiddenDishIds.filter((x) => x !== id),
    };
  });
}

export function toggleHidden(id: string) {
  updateConfig((c) => ({
    ...c,
    hiddenDishIds: c.hiddenDishIds.includes(id)
      ? c.hiddenDishIds.filter((x) => x !== id)
      : [...c.hiddenDishIds, id],
  }));
}

export function saveKitchenProfile(name: string, kitchen: Kitchen) {
  updateConfig((c) => ({
    ...c,
    kitchenProfiles: [
      ...c.kitchenProfiles.filter((p) => p.name !== name),
      { id: `kp-${Date.now()}`, name, kitchen },
    ].slice(-30),
  }));
}

export function deleteKitchenProfile(id: string) {
  updateConfig((c) => ({ ...c, kitchenProfiles: c.kitchenProfiles.filter((p) => p.id !== id) }));
}

export function saveScenario(name: string, note: string, conditions: Conditions) {
  updateConfig((c) => ({
    ...c,
    savedScenarios: [
      ...c.savedScenarios.filter((s) => s.name !== name),
      { id: `sc-${Date.now()}`, name, note, conditions: conditions as unknown as Record<string, unknown> },
    ].slice(-40),
  }));
}

export function deleteScenario(id: string) {
  updateConfig((c) => ({ ...c, savedScenarios: c.savedScenarios.filter((s) => s.id !== id) }));
}

// ---- portability --------------------------------------------------------

export function exportConfig(): string {
  return JSON.stringify(snapshot(), null, 2);
}

export function importConfig(raw: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = configSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { ok: false, error: first ? `${first.path.join(".") || "file"}: ${first.message}` : "Invalid file" };
    }
    writeConfig(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "That file is not readable JSON." };
  }
}

export function clearConfig() {
  writeConfig(EMPTY_CONFIG);
}

export function blankDish(): Dish {
  return {
    id: `custom-${Date.now().toString(36)}`,
    name: "Untitled dish",
    course: "side",
    note: "",
    contains: [],
    formats: ["seated", "buffet"],
    shapes: ["dinner"],
    ovenMin: 0,
    burnerMin: 0,
    fridgeUnits: 1,
    counter: 1,
    activeMin: 15,
    servesPerBatch: 6,
    makeAheadDays: 1,
    holdMin: 60,
    ingredients: [],
    season: ["year-round"],
    costPerGuest: 2,
    method: "raw",
    tempBand: "cold",
  };
}
