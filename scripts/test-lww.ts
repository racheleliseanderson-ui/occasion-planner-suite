/**
 * Last-write-wins merge self-test. Run:
 *   node --experimental-strip-types scripts/test-lww.ts
 */
import { mergeConfigLww, mergeScenarioPackLww, formatMergeReport } from "../src/lib/oos/lww.ts";
import type { OosConfig, SavedScenario } from "../src/lib/oos/store.ts";

function blank(over: Partial<OosConfig> = {}): OosConfig {
  return {
    version: 1,
    customDishes: [],
    dishOverrides: {},
    hiddenDishIds: [],
    hiddenClocks: {},
    kitchenProfiles: [],
    savedScenarios: [],
    runHistory: [],
    removed: {},
    ...over,
  };
}

function dish(id: string, name: string, updatedAt?: number) {
  return {
    id,
    name,
    course: "side" as const,
    note: "",
    contains: [],
    formats: ["seated" as const],
    shapes: ["dinner" as const],
    ovenMin: 0,
    burnerMin: 0,
    fridgeUnits: 0,
    counter: 1,
    activeMin: 0,
    servesPerBatch: 6,
    makeAheadDays: 1 as const,
    holdMin: 0,
    ingredients: [],
    ...(updatedAt !== undefined ? { updatedAt } : {}),
  };
}

function scenario(id: string, name: string, updatedAt?: number): SavedScenario {
  return {
    id,
    name,
    note: "",
    conditions: {},
    pinned: false,
    kitchenProfile: "",
    createdAt: updatedAt ?? 0,
    ...(updatedAt !== undefined ? { updatedAt } : {}),
  };
}

let failed = 0;
function assert(name: string, cond: unknown) {
  if (cond) {
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}`);
}

const emptyLocal = blank();
const incomingLib = blank({
  customDishes: [dish("custom-a", "A", 10)],
  updatedAt: 10,
});
const restore = mergeConfigLww(emptyLocal, incomingLib, 100);
assert("empty local restores incoming", restore.report.restored && restore.config.customDishes[0]?.id === "custom-a");

const localNewer = blank({
  customDishes: [dish("custom-a", "Local A", 50)],
  updatedAt: 50,
});
const incomingOlder = blank({
  customDishes: [dish("custom-a", "Phone A", 20)],
  updatedAt: 20,
});
const keep = mergeConfigLww(localNewer, incomingOlder, 100);
assert("newer local wins", keep.config.customDishes[0]?.name === "Local A" && keep.report.keptLocal === 1);

const incomingNewer = blank({
  customDishes: [dish("custom-a", "Phone A", 80)],
  updatedAt: 80,
});
const take = mergeConfigLww(localNewer, incomingNewer, 100);
assert("newer incoming wins", take.config.customDishes[0]?.name === "Phone A" && take.report.tookIncoming === 1);

const tie = mergeConfigLww(
  blank({ customDishes: [dish("custom-a", "Local", 40)] }),
  blank({ customDishes: [dish("custom-a", "Incoming", 40)] }),
  100,
);
assert("tie goes to incoming", tie.config.customDishes[0]?.name === "Incoming");

const withLocalOnly = mergeConfigLww(
  blank({ customDishes: [dish("custom-a", "A", 10), dish("custom-b", "B", 10)] }),
  blank({ customDishes: [dish("custom-a", "A2", 20), dish("custom-c", "C", 20)] }),
  100,
);
assert(
  "local-only kept and incoming-only added",
  withLocalOnly.config.customDishes.some((d) => d.id === "custom-b") &&
    withLocalOnly.config.customDishes.some((d) => d.id === "custom-c") &&
    withLocalOnly.report.added === 1,
);

const tombstoned = mergeConfigLww(
  blank({
    removed: { "custom-a": 90 },
  }),
  blank({
    customDishes: [dish("custom-a", "Zombie", 40)],
  }),
  100,
);
assert("newer tombstone beats live incoming", tombstoned.config.customDishes.length === 0 && tombstoned.report.stayedRemoved === 1);

const unhide = mergeConfigLww(
  blank({
    hiddenDishIds: ["roast"],
    hiddenClocks: { roast: 10 },
  }),
  blank({
    hiddenDishIds: [],
    hiddenClocks: { roast: 40 },
  }),
  100,
);
assert("newer unhide wins", unhide.config.hiddenDishIds.includes("roast") === false);

const legacyHide = mergeConfigLww(
  blank({
    hiddenDishIds: ["roast"],
    hiddenClocks: { roast: 10 },
  }),
  blank({
    hiddenDishIds: ["pie"],
  }),
  100,
);
assert(
  "unstamped incoming hide is add-only",
  legacyHide.config.hiddenDishIds.includes("roast") && legacyHide.config.hiddenDishIds.includes("pie"),
);

const localRuns = blank({
  customDishes: [dish("custom-a", "A", 10)],
  runHistory: [
    {
      id: "r1",
      at: 1,
      label: "local run",
      signature: "sig",
      feasibility: 70,
      balance: 70,
      verdict: "tight",
      stops: 0,
      binding: "oven",
      conditions: {},
    },
  ],
});
const incomingRuns = blank({
  customDishes: [dish("custom-a", "A", 10)],
  runHistory: [
    {
      id: "r2",
      at: 2,
      label: "other run",
      signature: "sig2",
      feasibility: 80,
      balance: 80,
      verdict: "controlled",
      stops: 0,
      binding: "hands",
      conditions: {},
    },
  ],
});
const runs = mergeConfigLww(localRuns, incomingRuns, 100);
assert("run history stays local", runs.config.runHistory[0]?.id === "r1");

const aliased = mergeConfigLww(
  blank({
    savedScenarios: [scenario("sc-old", "Sunday lunch", 10)],
  }),
  blank({
    savedScenarios: [scenario("sc-new", "Sunday lunch", 40)],
  }),
  100,
);
assert("same name different id still LWW", aliased.config.savedScenarios[0]?.id === "sc-new");

const pack = mergeScenarioPackLww(
  [scenario("sc-a", "A", 50)],
  [scenario("sc-a", "A from phone", 20), scenario("sc-b", "B", 20)],
  {},
  100,
);
assert(
  "pack merge keeps newer and adds missing",
  pack.items[0]?.name === "A" && pack.items.some((s) => s.id === "sc-b"),
);

assert(
  "copy names the device",
  formatMergeReport({ restored: false, added: 1, tookIncoming: 2, keptLocal: 3, stayedRemoved: 0 }).includes(
    "This device kept 3",
  ),
);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall passed");
