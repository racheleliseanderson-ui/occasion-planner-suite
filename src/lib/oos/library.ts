import { DISHES } from "./dishes";
import { EXTRA_DISHES } from "./dishes-extra";
import type { Dish } from "./types";

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

function normalise(d: Dish): Dish {
  return {
    ...d,
    season: d.season ?? ["year-round"],
    costPerGuest: d.costPerGuest ?? DEFAULT_COST[d.course],
    method: d.method ?? (d.ovenMin > 0 ? "roast" : d.burnerMin > 0 ? "boil" : "raw"),
    tempBand: d.tempBand ?? (d.ovenMin > 0 || d.burnerMin > 0 ? "hot" : "cold"),
  };
}

/** The single merged library every consumer reads. */
export const LIBRARY: Dish[] = [...DISHES, ...EXTRA_DISHES].map(normalise);
