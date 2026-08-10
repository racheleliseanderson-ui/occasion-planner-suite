import { DISHES } from "./dishes";
import { EXTRA_DISHES } from "./dishes-extra";
import { TABLE_DISHES } from "./dishes-table";
import { CROWD_DISHES } from "./dishes-crowd";
import { CONSTRAINT_DISHES } from "./dishes-constraint";
import type { Dish } from "./types";
import type { OosConfig } from "./store";


/** Indicative planning cost when a fixture predates the cost field. */
const DEFAULT_COST: Record<Dish["course"], number> = {
  board: 4,
  starter: 2.5,
  anchor: 6,
  side: 1.6,
  bread: 1,
  sweet: 1.8,
  drink: 2,
};

export function normalise(d: Dish): Dish {
  return {
    ...d,
    season: d.season ?? ["year-round"],
    costPerGuest: d.costPerGuest ?? DEFAULT_COST[d.course],
    method: d.method ?? (d.ovenMin > 0 ? "roast" : d.burnerMin > 0 ? "boil" : "raw"),
    tempBand: d.tempBand ?? (d.ovenMin > 0 || d.burnerMin > 0 ? "hot" : "cold"),
  };
}

/** The untouched first-party fixture set, de-duplicated by id (first wins). */
export const FIXTURES: Dish[] = [
  ...DISHES,
  ...EXTRA_DISHES,
  ...TABLE_DISHES,
  ...CROWD_DISHES,
  ...CONSTRAINT_DISHES,
]
  .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i)
  .map(normalise);


/** Back-compatible default library (no personal overrides applied). */
export const LIBRARY: Dish[] = FIXTURES;

/** Ids shipped with the instrument; anything else is the host's own. */
export const FIXTURE_IDS = new Set(FIXTURES.map((d) => d.id));

export function isFixture(id: string): boolean {
  return FIXTURE_IDS.has(id);
}


/**
 * The library the engine actually plans against: fixtures, with the host's
 * edits merged over the top, hidden dishes removed, custom dishes appended.
 */
export function resolveLibrary(config: OosConfig): Dish[] {
  const hidden = new Set(config.hiddenDishIds);
  const merged = FIXTURES.map((d) => {
    const patch = config.dishOverrides[d.id];
    return patch ? normalise({ ...d, ...(patch as Partial<Dish>) }) : d;
  }).filter((d) => !hidden.has(d.id));
  const custom = (config.customDishes as unknown as Dish[])
    .filter((d) => !hidden.has(d.id))
    .map(normalise);
  return [...merged, ...custom];
}
