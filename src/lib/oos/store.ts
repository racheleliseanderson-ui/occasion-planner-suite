import { useSyncExternalStore } from "react";
import { z } from "zod";
import { mergeConfigLww, mergeScenarioPackLww, type MergeReport } from "./lww";
import type { Conditions, Dish, Kitchen } from "./types";

/**
 * Client-side configuration store.
 * Everything the host personalises — dish overrides, custom dishes, hidden
 * fixtures, kitchen profiles and saved scenarios — lives in localStorage and
 * travels as a single portable JSON file. No backend, no account, no upload.
 * Import merges last-write-wins; newer `updatedAt` wins. Deletes are tombstones.
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
const cuisine = z.enum([
  "house","italian","aegean","levantine","persian","indian","seasia","chinese","japanese","mexican","caribbean","west-african","nordic",
]);

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
  cuisine: cuisine.optional(),
  updatedAt: z.number().int().nonnegative().optional(),
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
  /** favourites float to the top of the gallery */
  pinned: z.boolean().default(false),
  /** the kitchen profile in force when the preset was captured */
  kitchenProfile: z.string().max(60).default(""),
  createdAt: z.number().default(0),
  updatedAt: z.number().int().nonnegative().optional(),
});


const profileSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(60),
  kitchen: kitchenSchema,
  updatedAt: z.number().int().nonnegative().optional(),
});

const runRecordSchema = z.object({
  id: z.string(),
  at: z.number(),
  label: z.string().max(80),
  signature: z.string().max(40),
  feasibility: z.number(),
  balance: z.number(),
  verdict: z.string().max(24),
  stops: z.number(),
  binding: z.string().max(80),
  conditions: z.record(z.string(), z.unknown()),
});

export const configSchema = z.object({
  version: z.literal(1).default(1),
  updatedAt: z.number().int().nonnegative().optional(),
  customDishes: z.array(dishSchema).max(400).default([]),
  dishOverrides: z.record(z.string(), dishSchema.partial()).default({}),
  hiddenDishIds: z.array(z.string()).default([]),
  hiddenClocks: z.record(z.string(), z.number()).default({}),
  kitchenProfiles: z.array(profileSchema).max(30).default([]),
  savedScenarios: z.array(scenarioSchema).max(60).default([]),
  /** completed build runs, newest first, capped so the store stays small */
  runHistory: z.array(runRecordSchema).max(20).default([]),
  /** how packet PDFs are laid out on paper; remembered between sessions */
  printLayout: z
    .object({
      page: z.enum(["a4", "letter", "legal"]).default("a4"),
      margin: z.enum(["narrow", "standard", "wide"]).default("standard"),
      header: z.boolean().default(true),
      footer: z.boolean().default(true),
    })
    .default({ page: "a4", margin: "standard", header: true, footer: true }),
  /** id → time-of-delete; a newer tombstone beats a live record on merge */
  removed: z.record(z.string(), z.number()).default({}),
});

export type OosConfig = z.infer<typeof configSchema>;
export type KitchenProfile = z.infer<typeof profileSchema>;
export type SavedScenario = z.infer<typeof scenarioSchema>;

export const EMPTY_CONFIG: OosConfig = {
  version: 1,
  customDishes: [],
  dishOverrides: {},
  hiddenDishIds: [],
  hiddenClocks: {},
  kitchenProfiles: [],
  savedScenarios: [],
  runHistory: [],
  printLayout: { page: "a4", margin: "standard", header: true, footer: true },
  removed: {},
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
  current = { ...next, updatedAt: Date.now() };
  loaded = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
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

function forgetRemoved(removed: Record<string, number>, id: string): Record<string, number> {
  if (!(id in removed)) return removed;
  const next = { ...removed };
  delete next[id];
  return next;
}

export function saveDish(dish: Dish, isFixture: boolean) {
  const stamped = { ...dish, updatedAt: Date.now() };
  updateConfig((c) =>
    isFixture
      ? {
          ...c,
          dishOverrides: { ...c.dishOverrides, [dish.id]: stamped },
          removed: forgetRemoved(c.removed, dish.id),
        }
      : {
          ...c,
          customDishes: [
            ...c.customDishes.filter((d) => d.id !== dish.id),
            stamped as OosConfig["customDishes"][number],
          ],
          removed: forgetRemoved(c.removed, dish.id),
        },
  );
}

/**
 * Apply a validated bulk import. Rows matching a shipped fixture become
 * overrides; everything else is stored as a custom dish. Nothing is destroyed.
 * Each row is stamped now so a later merge treats the import as the newer write.
 */
export function bulkApplyDishes(dishes: Dish[], fixtureIds: Set<string>) {
  const when = Date.now();
  updateConfig((c) => {
    const overrides = { ...c.dishOverrides };
    const custom = [...c.customDishes];
    let removed = c.removed;
    for (const d of dishes) {
      const stamped = { ...d, updatedAt: when };
      removed = forgetRemoved(removed, d.id);
      if (fixtureIds.has(d.id)) overrides[d.id] = stamped;
      else {
        const i = custom.findIndex((x) => x.id === d.id);
        if (i >= 0) custom[i] = stamped as OosConfig["customDishes"][number];
        else custom.push(stamped as OosConfig["customDishes"][number]);
      }
    }
    return { ...c, dishOverrides: overrides, customDishes: custom.slice(0, 400), removed };
  });
}

export function resetDish(id: string) {
  const when = Date.now();
  updateConfig((c) => {
    const next = { ...c.dishOverrides };
    delete next[id];
    return {
      ...c,
      dishOverrides: next,
      customDishes: c.customDishes.filter((d) => d.id !== id),
      hiddenDishIds: c.hiddenDishIds.filter((x) => x !== id),
      hiddenClocks: { ...c.hiddenClocks, [id]: when },
      removed: { ...c.removed, [id]: when },
    };
  });
}

export function toggleHidden(id: string) {
  const when = Date.now();
  updateConfig((c) => ({
    ...c,
    hiddenDishIds: c.hiddenDishIds.includes(id)
      ? c.hiddenDishIds.filter((x) => x !== id)
      : [...c.hiddenDishIds, id],
    hiddenClocks: { ...c.hiddenClocks, [id]: when },
  }));
}

export function saveKitchenProfile(name: string, kitchen: Kitchen) {
  const when = Date.now();
  updateConfig((c) => {
    const existing = c.kitchenProfiles.find((p) => p.name === name);
    const id = existing?.id ?? `kp-${when}`;
    return {
      ...c,
      kitchenProfiles: [
        ...c.kitchenProfiles.filter((p) => p.name !== name),
        { id, name, kitchen, updatedAt: when },
      ].slice(-30),
      removed: forgetRemoved(c.removed, id),
    };
  });
}

export function deleteKitchenProfile(id: string) {
  const when = Date.now();
  updateConfig((c) => ({
    ...c,
    kitchenProfiles: c.kitchenProfiles.filter((p) => p.id !== id),
    removed: { ...c.removed, [id]: when },
  }));
}

/**
 * Presets capture the whole declared state — conditions, operating conditions
 * and the kitchen profile in force — not a partial patch.
 */
export function saveScenario(
  name: string,
  note: string,
  conditions: Conditions,
  kitchenProfile = "",
): void {
  const when = Date.now();
  updateConfig((c) => {
    const existing = c.savedScenarios.find((s) => s.name === name);
    const id = existing?.id ?? `sc-${when.toString(36)}`;
    return {
      ...c,
      savedScenarios: [
        ...c.savedScenarios.filter((s) => s.name !== name),
        {
          id,
          name,
          note,
          conditions: conditions as unknown as Record<string, unknown>,
          pinned: existing?.pinned ?? false,
          kitchenProfile,
          createdAt: existing?.createdAt ?? when,
          updatedAt: when,
        },
      ].slice(-60),
      removed: forgetRemoved(c.removed, id),
    };
  });
}

export function deleteScenario(id: string) {
  const when = Date.now();
  updateConfig((c) => ({
    ...c,
    savedScenarios: c.savedScenarios.filter((s) => s.id !== id),
    removed: { ...c.removed, [id]: when },
  }));
}

/** Put a removed preset back exactly where it was. */
export function restoreScenario(scenario: SavedScenario, index: number) {
  const when = Date.now();
  updateConfig((c) => {
    const next = c.savedScenarios.filter((s) => s.id !== scenario.id);
    next.splice(Math.max(0, Math.min(index, next.length)), 0, { ...scenario, updatedAt: when });
    return { ...c, savedScenarios: next, removed: forgetRemoved(c.removed, scenario.id) };
  });
}

export function updateScenario(id: string, patch: Partial<SavedScenario>) {
  const when = Date.now();
  updateConfig((c) => ({
    ...c,
    savedScenarios: c.savedScenarios.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: when } : s)),
  }));
}

export function toggleScenarioPin(id: string) {
  const when = Date.now();
  updateConfig((c) => ({
    ...c,
    savedScenarios: c.savedScenarios.map((s) =>
      s.id === id ? { ...s, pinned: !s.pinned, updatedAt: when } : s,
    ),
  }));
}

export function duplicateScenario(id: string) {
  const when = Date.now();
  updateConfig((c) => {
    const src = c.savedScenarios.find((s) => s.id === id);
    if (!src) return c;
    const base = `${src.name} (copy)`.slice(0, 60);
    let name = base;
    let n = 2;
    while (c.savedScenarios.some((s) => s.name === name)) name = `${base} ${n++}`.slice(0, 60);
    const newId = `sc-${when.toString(36)}`;
    return {
      ...c,
      savedScenarios: [
        ...c.savedScenarios,
        { ...src, id: newId, name, pinned: false, createdAt: when, updatedAt: when },
      ].slice(-60),
      removed: forgetRemoved(c.removed, newId),
    };
  });
}

// ---- preset packs -------------------------------------------------------

const packSchema = z.object({
  kind: z.literal("oos-preset-pack"),
  version: z.literal(1),
  presets: z.array(scenarioSchema).max(60),
});

export function exportScenarioPack(): string {
  return JSON.stringify(
    { kind: "oos-preset-pack", version: 1, presets: snapshot().savedScenarios },
    null,
    2,
  );
}

/** Merge a pack in by id (then name); last-write-wins. Nothing newer on this device is destroyed. */
export function importScenarioPack(raw: string): { ok: true; report: MergeReport } | { ok: false; error: string } {
  try {
    const parsed = packSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { ok: false, error: "That file is not a preset pack." };
    let report: MergeReport = { restored: false, added: 0, tookIncoming: 0, keptLocal: 0, stayedRemoved: 0 };
    updateConfig((c) => {
      const merged = mergeScenarioPackLww(c.savedScenarios, parsed.data.presets, c.removed);
      report = merged.report;
      return { ...c, savedScenarios: merged.items, removed: merged.removed };
    });
    return { ok: true, report };
  } catch {
    return { ok: false, error: "That file is not readable JSON." };
  }
}


// ---- portability --------------------------------------------------------

export type { MergeReport } from "./lww";
export { formatMergeReport } from "./lww";

export function exportConfig(): string {
  return JSON.stringify(snapshot(), null, 2);
}

export function importConfig(raw: string): { ok: true; report: MergeReport } | { ok: false; error: string } {
  try {
    const parsed = configSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { ok: false, error: first ? `${first.path.join(".") || "file"}: ${first.message}` : "Invalid file" };
    }
    const { config, report } = mergeConfigLww(snapshot(), parsed.data);
    writeConfig(config);
    return { ok: true, report };
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


/** Record a completed build run. Newest first, oldest pruned. */
export function recordRun(run: OosConfig["runHistory"][number]) {
  updateConfig((c) => ({ ...c, runHistory: [run, ...c.runHistory].slice(0, 12) }));
}

/** Persist the paper settings used by every packet and decision PDF. */
export function setPrintLayout(layout: OosConfig["printLayout"]) {
  updateConfig((c) => ({ ...c, printLayout: layout }));
}

export function clearRunHistory() {
  updateConfig((c) => ({ ...c, runHistory: [] }));
}
