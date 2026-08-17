import type { Conditions, Kitchen, Ops } from "./types";

/**
 * Extended operating conditions.
 *
 * Everything here changes the plan: the declared limits are folded into an
 * effective kitchen before the engine models load, and the remainder produce
 * their own gauges, stops and advisories. Nothing is decorative.
 */

export const DEFAULT_OPS: Ops = {
  table: {
    tables: 1,
    seatsPerTable: 8,
    courses: 3,
    serviceMode: "family",
    tablesideFinishing: false,
  },
  crowd: {
    standingShare: 0,
    arrivalSpreadMin: 20,
    stations: 1,
    selfServe: false,
    refillCadenceMin: 30,
  },
  constraint: {
    sink: "single",
    prepSurfaces: 2,
    singleBurnerMode: false,
    noOvenMode: false,
    coldBoxes: 0,
    powerLimited: false,
    curfew: false,
    shoppingTrips: 2,
    pantryOnly: false,
    hardCapPerHead: null,
  },
  outdoor: {
    grillType: "none",
    smoker: false,
    firePit: false,
    power: false,
    water: false,
    shade: true,
    weatherRisk: "low",
    transportMin: 0,
    coolerCapacity: 0,
    insectPressure: false,
  },
  general: {
    skill: 2,
    alcohol: true,
    serviceDurationMin: 120,
    cleanupWindowMin: 60,
    dietStrictness: "preference",
  },
};

/** Fill any missing group so older saved conditions keep planning. */
export function withDefaults(ops?: Partial<Ops>): Ops {
  return {
    table: { ...DEFAULT_OPS.table, ...(ops?.table ?? {}) },
    crowd: { ...DEFAULT_OPS.crowd, ...(ops?.crowd ?? {}) },
    constraint: { ...DEFAULT_OPS.constraint, ...(ops?.constraint ?? {}) },
    outdoor: { ...DEFAULT_OPS.outdoor, ...(ops?.outdoor ?? {}) },
    general: { ...DEFAULT_OPS.general, ...(ops?.general ?? {}) },
  };
}

/** Hands-on minutes scale with declared skill: a confident cook is faster. */
export const SKILL_FACTOR: Record<1 | 2 | 3, number> = { 1: 1.3, 2: 1, 3: 0.85 };

/**
 * Fold the declared limits into the kitchen the engine plans against.
 * Declared constraints always tighten; declared outdoor kit always adds.
 */
export function effectiveKitchen(kitchen: Kitchen, ops: Ops): Kitchen {
  const { constraint, outdoor, table } = ops;
  const grill = kitchen.grill || outdoor.grillType !== "none" || outdoor.smoker || outdoor.firePit;
  let burners = constraint.singleBurnerMode ? Math.min(kitchen.burners, 1) : kitchen.burners;
  let ovens = constraint.noOvenMode ? 0 : kitchen.ovens;
  if (constraint.powerLimited) {
    // A limited supply cannot run every ring and the oven at once.
    burners = Math.min(burners, 2);
    ovens = Math.min(ovens, 1);
  }
  // Never invent chairs. Table layout describes how declared seats are arranged.
  const seats = kitchen.seats;
  const counter: Kitchen["counter"] =
    constraint.prepSurfaces <= 1 ? "small" : constraint.prepSurfaces >= 4 ? "large" : kitchen.counter;
  return { ...kitchen, ovens, burners, grill, seats, counter };
}

/** Extra cold capacity, in the same shelf units the cold gauge uses. */
export function coldBonus(ops: Ops): number {
  return ops.constraint.coldBoxes * 4 + Math.round(ops.outdoor.coolerCapacity);
}

/** Wash-up throughput multiplier from the declared sink. */
export const SINK_FACTOR: Record<Ops["constraint"]["sink"], number> = {
  scarce: 0.6,
  single: 1,
  double: 1.3,
};

/** Normalise a set of conditions: defaults filled, kitchen folded, alcohol honoured. */
export function normaliseConditions(c: Conditions): Conditions {
  const ops = withDefaults(c.ops);
  const diets = ops.general.alcohol || c.diets.includes("no-alcohol") ? c.diets : [...c.diets, "no-alcohol" as const];
  return {
    ...c,
    ops,
    diets,
    outdoor: c.outdoor || ops.outdoor.grillType !== "none" || ops.outdoor.smoker,
    kitchen: effectiveKitchen(c.kitchen, ops),
  };
}
