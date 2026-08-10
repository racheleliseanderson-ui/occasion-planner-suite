import { LIBRARY } from "./library";
import { SINK_FACTOR, SKILL_FACTOR, coldBonus, normaliseConditions } from "./ops";

import type {
  Conditions,
  Contains,
  Dish,
  DietFilter,
  LoadGauge,
  LoadLabel,
  Plan,
  PlannedDish,
  ShoppingLine,
  Stop,
  TimelineEntry,
} from "./types";

const EXCLUSIONS: Record<DietFilter, Contains[]> = {
  "no-meat": ["meat", "pork", "fish", "shellfish"],
  "no-animal": ["meat", "pork", "fish", "shellfish", "dairy", "egg"],
  "no-gluten": ["gluten"],
  "no-dairy": ["dairy"],
  "no-nut": ["nut"],
  "no-shellfish": ["shellfish"],
  "no-pork": ["pork"],
  "no-alcohol": ["alcohol"],
};

export const DIET_LABELS: Record<DietFilter, string> = {
  "no-meat": "Vegetarian route",
  "no-animal": "Plant-only route",
  "no-gluten": "Gluten-avoiding",
  "no-dairy": "Dairy-avoiding",
  "no-nut": "Nut-avoiding",
  "no-shellfish": "Shellfish-avoiding",
  "no-pork": "Pork-free",
  "no-alcohol": "Alcohol-free",
};

export function parseClock(t: string): number {
  const parts = t.split(":").map((n) => parseInt(n, 10));
  const h = parts[0];
  const m = parts[1];
  return (h === undefined || isNaN(h) ? 18 : h) * 60 + (m === undefined || isNaN(m) ? 0 : m);
}

export function formatClock(totalMin: number): string {
  let m = Math.round(totalMin) % 1440;
  if (m < 0) m += 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function labelFor(pct: number): LoadLabel {
  if (pct > 100) return "overloaded";
  if (pct >= 78) return "tight";
  if (pct < 32) return "under-used";
  return "controlled";
}

function dietOk(dish: Dish, diets: DietFilter[]): boolean {
  const banned = new Set<Contains>();
  diets.forEach((d) => EXCLUSIONS[d].forEach((c) => banned.add(c)));
  return !dish.contains.some((c) => banned.has(c));
}

function equipmentOk(dish: Dish, c: Conditions): boolean {
  if (dish.grill && !c.kitchen.grill) return false;
  if (dish.ovenMin > 0 && c.kitchen.ovens === 0) return false;
  if (dish.burnerMin > 0 && c.kitchen.burners === 0) return false;
  return true;
}

const FRIDGE_CAP = { tight: 11, normal: 17, roomy: 25 } as const;
const COUNTER_CAP = { small: 4, medium: 7, large: 11 } as const;

/** Per-head ceiling for each budget tier, in local currency units. */
export const BUDGET_CEILING: Record<Conditions["budgetTier"], number> = { 1: 12, 2: 22, 3: 40 };

export const BUDGET_LABELS: Record<Conditions["budgetTier"], string> = {
  1: "Modest",
  2: "Considered",
  3: "Unconstrained",
};

const cost = (d: Dish) => d.costPerGuest ?? 2;

function seasonFit(d: Dish, season: Conditions["season"]): number {
  const list = d.season ?? ["year-round"];
  if (list.includes("year-round")) return 8;
  if (list.includes(season)) return 22;
  return -18;
}

function pick(
  pool: Dish[],
  course: Dish["course"],
  count: number,
  c: Conditions,
  taken: Set<string>,
  chosen: Dish[],
): Dish[] {
  const tightOven = c.kitchen.ovens <= 1;
  const shortWindow = c.prepWindowH <= 4;
  const ceiling = BUDGET_CEILING[c.budgetTier];
  const spent = chosen.reduce((s, d) => s + cost(d), 0);
  const methods = new Set(chosen.map((d) => d.method));
  const temps = new Set(chosen.map((d) => d.tempBand));
  const dayOfCount = chosen.filter((d) => d.makeAheadDays === 0).length;

  const scored = pool
    .filter((d) => d.course === course && !taken.has(d.id))
    .map((d) => {
      let s = 0;
      if (d.shapes.includes(c.shape)) s += 40;
      if (d.formats.includes(c.style)) s += 25;
      s += seasonFit(d, c.season);
      if (shortWindow) s += d.makeAheadDays * 14;
      if (tightOven) s -= Math.min(d.ovenMin, 120) / 14;
      if (c.kitchen.burners <= 2) s -= Math.min(d.burnerMin, 90) / 8;
      if (c.helpers === 0) s -= d.activeMin / 6;
      s += (3 - c.ambition) * (d.makeAheadDays * 3);
      s += c.ambition * (d.activeMin / 40);

      // Balance: the route should not repeat one method, one temperature band,
      // or stack every dish into the day-of window.
      if (methods.has(d.method)) s -= 16;
      if (temps.has(d.tempBand)) s -= 10;
      if (d.makeAheadDays === 0 && dayOfCount >= 3) s -= 20;

      // Budget: trim ambition rather than silently overspending.
      const headroom = ceiling - spent;
      if (cost(d) > headroom) s -= 30;
      s -= cost(d) * (c.budgetTier === 1 ? 2.4 : c.budgetTier === 2 ? 1.1 : 0.3);

      if (c.kids && d.kidFriendly) s += 12;
      if (c.outdoor && d.outdoorSafe) s += 10;
      if (c.leftovers === "deliberate") s += d.holdMin / 40;
      if (c.leftovers === "none") s -= d.holdMin / 90;
      if (c.kitchen.grill && d.grill) s += 12;

      return { d, s };
    })
    .sort((a, b) => b.s - a.s || a.d.id.localeCompare(b.d.id));

  const out = scored.slice(0, count).map((x) => x.d);
  // `chosen` is the caller's accumulator; it appends the return value itself.
  out.forEach((d) => taken.add(d.id));
  return out;
}


function buildMenu(c: Conditions, library: Dish[]): Dish[] {
  const pool = library.filter((d) => dietOk(d, c.diets) && equipmentOk(d, c));
  const taken = new Set<string>();
  const out: Dish[] = [];
  const big = c.guests >= 10;

  if (c.style === "seated") {
    out.push(...pick(pool, "starter", 1, c, taken, out));
    out.push(...pick(pool, "anchor", 1, c, taken, out));
    out.push(...pick(pool, "side", c.ambition >= 2 ? 2 : 1, c, taken, out));
    out.push(...pick(pool, "bread", 1, c, taken, out));
    out.push(...pick(pool, "sweet", 1, c, taken, out));
  } else if (c.style === "buffet") {
    out.push(...pick(pool, "board", big ? 1 : 0, c, taken, out));
    out.push(...pick(pool, "anchor", c.ambition === 3 && big ? 2 : 1, c, taken, out));
    out.push(...pick(pool, "side", 2, c, taken, out));
    out.push(...pick(pool, "bread", 1, c, taken, out));
    out.push(...pick(pool, "sweet", 1, c, taken, out));
  } else if (c.style === "grazing") {
    out.push(...pick(pool, "board", 2, c, taken, out));
    out.push(...pick(pool, "starter", 1, c, taken, out));
    out.push(...pick(pool, "side", c.ambition >= 2 ? 2 : 1, c, taken, out));
    out.push(...pick(pool, "sweet", 1, c, taken, out));
  } else {
    out.push(...pick(pool, "board", 2, c, taken, out));
    out.push(...pick(pool, "starter", c.ambition >= 2 ? 2 : 1, c, taken, out));
    if (c.ambition >= 2) out.push(...pick(pool, "sweet", 1, c, taken, out));
  }

  // Drinks: zero-proof is equal status and always present.
  const zero = pool.find((d) => d.id === "drink-zero");
  if (zero) out.push(zero);
  if (!c.diets.includes("no-alcohol")) {
    const wine = pool.find((d) => d.id === "drink-wine");
    if (wine) out.push(wine);
  }
  const kit = library.find((d) => d.id === "non-food-service");
  if (kit) out.push(kit);

  return out;
}

function courseOrder(d: Dish): number {
  return ["board", "starter", "anchor", "side", "bread", "sweet", "drink"].indexOf(d.course);
}

export function buildPlan(input: Conditions, library: Dish[] = LIBRARY): Plan {
  // Declared operating conditions are folded in before anything is modelled.
  const c = normaliseConditions(input);
  const ops = c.ops!;
  const stops: Stop[] = [];
  const advisories: string[] = [];
  const dishes = buildMenu(c, library).sort((a, b) => courseOrder(a) - courseOrder(b));


  // Leftovers are a stated goal, not an accident: deliberate leftovers buy volume,
  // "none" trims to the tightest honest batch count.
  const volume = c.leftovers === "deliberate" ? 1.25 : c.leftovers === "none" ? 0.95 : 1.08;

  const menu: PlannedDish[] = dishes.map((dish) => {
    const batches = Math.max(1, Math.ceil((c.guests * volume) / dish.servesPerBatch));
    const shortWindow = c.prepWindowH <= 5;
    const when: PlannedDish["when"] =
      dish.makeAheadDays === 2 && (shortWindow || c.guests >= 10)
        ? "d2"
        : dish.makeAheadDays >= 1
          ? "d1"
          : "dayof";
    return { dish, batches, serves: batches * dish.servesPerBatch, when };
  });


  const dayOf = menu.filter((m) => m.when === "dayof");
  const windowMin = Math.round(c.prepWindowH * 60);

  // ---- Load model -------------------------------------------------------
  const ovenUsed = dayOf.reduce((s, m) => s + m.dish.ovenMin * m.batches, 0);
  const ovenCap = Math.max(1, c.kitchen.ovens) * windowMin * (c.kitchen.ovens === 0 ? 0 : 1);
  const burnerUsed = dayOf.reduce((s, m) => s + m.dish.burnerMin * m.batches, 0);
  const burnerCap = Math.max(0, c.kitchen.burners) * windowMin;
  const fridgeUsed =
    menu.reduce((s, m) => s + m.dish.fridgeUnits * Math.min(m.batches, 2), 0) +
    Math.ceil(c.guests / 8);
  const fridgeCap = FRIDGE_CAP[c.kitchen.fridge] + coldBonus(ops);
  const counterUsed = dayOf.reduce((s, m) => s + m.dish.counter, 0);
  const counterCap = COUNTER_CAP[c.kitchen.counter];
  // Plated service asks more of the host at the pass; family style asks less.
  const modeLoad = { plated: 2.6, family: 1.5, passed: 3.2 }[ops.table.serviceMode];
  const handsUsed = Math.round(
    (menu.reduce((s, m) => s + m.dish.activeMin * Math.min(m.batches, 3), 0) +
      dayOf.length * 6 +
      c.guests * modeLoad +
      (ops.table.tablesideFinishing ? c.guests * 1.2 : 0) +
      (c.style !== "seated" ? Math.max(0, ops.crowd.arrivalSpreadMin / ops.crowd.refillCadenceMin) * 8 : 0)) *
      SKILL_FACTOR[ops.general.skill],
  );
  const handsCap = windowMin * (1 + c.helpers * 0.85) + (c.prepWindowH > 6 ? 60 : 0);
  const styleWash = { seated: 4.2, buffet: 2.8, grazing: 2.1, cocktail: 1.6 }[c.style];
  const washUsed = Math.round(
    c.guests * styleWash * (1 + (ops.table.courses - 3) * 0.12) + dayOf.length * 3,
  );
  const washCap = Math.round(
    ((c.kitchen.dishwasher ? 90 : 45) + c.helpers * 25) * SINK_FACTOR[ops.constraint.sink],
  );

  const gauge = (
    key: string,
    name: string,
    used: number,
    capacity: number,
    unit: string,
    detail: string,
  ): LoadGauge => {
    const pct = capacity <= 0 ? 999 : Math.round((used / capacity) * 100);
    return { key, name, used: Math.round(used), capacity: Math.round(capacity), unit, pct, label: labelFor(pct), detail };
  };

  const gauges: LoadGauge[] = [
    gauge("oven", "Oven", ovenUsed, ovenCap, "min", `${c.kitchen.ovens} oven${c.kitchen.ovens === 1 ? "" : "s"} across a ${c.prepWindowH}h day-of window.`),
    gauge("burner", "Stovetop", burnerUsed, burnerCap, "burner-min", `${c.kitchen.burners} usable burners.`),
    gauge("cold", "Cold storage", fridgeUsed, fridgeCap, "shelf units", `Fridge described as ${c.kitchen.fridge}${coldBonus(ops) ? `, plus ${coldBonus(ops)} declared cool-box units` : ""}; make-ahead dishes must live somewhere.`),
    gauge("counter", "Counter & landing", counterUsed, counterCap, "zones", `${c.kitchen.counter} working surface with ${dayOf.length} day-of dishes.`),
    gauge("hands", "Host labour", handsUsed, handsCap, "min", `${c.helpers === 0 ? "Solo host" : `${c.helpers} helper${c.helpers === 1 ? "" : "s"}`} at ${["cautious", "confident", "practised"][ops.general.skill - 1]} pace, ${ops.table.serviceMode} service.`),
    gauge("wash", "Wash-up throughput", washUsed, washCap, "items", `${c.kitchen.dishwasher ? "Dishwasher available" : "Hand-wash only"}, ${ops.constraint.sink} sink across ${ops.table.courses} courses.`),
    gauge("cleanup", "Recovery window", Math.round(c.guests * styleWash * 0.9), ops.general.cleanupWindowMin, "min", "Clearing, cooling and covering after the last plate."),
  ];

  if (c.style === "seated") {
    gauges.push(
      gauge("table", "Table capacity", c.guests, c.kitchen.seats, "seats", `${ops.table.tables} table${ops.table.tables === 1 ? "" : "s"} at ${ops.table.seatsPerTable} seats. Seated service cannot exceed real seats.`),
    );
  } else {
    const seatedShare = Math.round(c.guests * (1 - ops.crowd.standingShare));
    gauges.push(
      gauge("table", "Seating pressure", seatedShare, Math.max(c.kitchen.seats, 1), "seats", `${Math.round(ops.crowd.standingShare * 100)}% of the room is expected to stand.`),
      gauge("stations", "Serving stations", c.guests, Math.max(1, ops.crowd.stations) * 14, "guests", `${ops.crowd.stations} serving point${ops.crowd.stations === 1 ? "" : "s"}, ${ops.crowd.selfServe ? "self-serve" : "hosted"}, refilled every ${ops.crowd.refillCadenceMin} min.`),
    );
  }


  // ---- Hard stops (fail closed) ----------------------------------------
  if (c.style === "seated" && c.guests > c.kitchen.seats) {
    stops.push({
      code: "CAP-01",
      title: "Seated service exceeds table capacity",
      detail: `${c.guests} guests against ${c.kitchen.seats} seats. The plan will not invent chairs.`,
      correction: "Reduce guests, add real seats, or switch service style to buffet or grazing.",
    });
  }
  if (c.kitchen.ovens === 0 && menu.some((m) => m.dish.ovenMin > 0)) {
    stops.push({
      code: "EQP-01",
      title: "Oven route selected without an oven",
      detail: "A dish in the route requires oven time that does not exist.",
      correction: "Declare an oven, or rebuild — the engine will select stovetop and cold routes only.",
    });
  }
  if (c.shape === "cookout" && !c.kitchen.grill) {
    stops.push({
      code: "EQP-02",
      title: "Cookout without declared grill",
      detail: "Cookout shape assumes outdoor heat that has not been confirmed.",
      correction: "Confirm the grill, or change occasion shape to buffet dinner.",
    });
  }
  if (ovenCap > 0 && ovenUsed > ovenCap) {
    stops.push({
      code: "LOAD-01",
      title: "Oven demand exceeds the day-of window",
      detail: `${Math.round(ovenUsed)} oven-minutes required against ${Math.round(ovenCap)} available.`,
      correction: "Extend the prep window, drop an oven dish, or move one dish to a make-ahead day.",
    });
  }
  if (handsUsed > handsCap * 1.25) {
    stops.push({
      code: "LOAD-02",
      title: "Labour demand is not survivable as configured",
      detail: `${Math.round(handsUsed)} hands-on minutes against roughly ${Math.round(handsCap)} available.`,
      correction: "Add a helper, extend the window, reduce ambition, or cut a course.",
    });
  }
  if (menu.filter((m) => m.dish.course === "anchor" || m.dish.course === "board").length === 0) {
    stops.push({
      code: "DIET-01",
      title: "No anchor survives the current filters",
      detail: "The combined dietary filters and equipment reality remove every main route in the fixture set.",
      correction: "Relax one filter, or declare more equipment. Nothing will be substituted silently.",
    });
  }

  // ---- Declared-condition stops ----------------------------------------
  if (c.style === "cocktail" || c.style === "grazing") {
    const shortHold = menu.filter(
      (m) => m.dish.course !== "drink" && m.dish.holdMin > 0 && m.dish.holdMin < ops.crowd.arrivalSpreadMin,
    );
    if (shortHold.length >= 2) {
      stops.push({
        code: "FLOW-01",
        title: "Arrivals are spread wider than the food holds",
        detail: `${shortHold.length} dishes hold for less time than the ${ops.crowd.arrivalSpreadMin}-minute arrival spread.`,
        correction: "Tighten the arrival window, add a station and stagger the release, or choose dishes that hold.",
      });
    }
  }
  if (ops.crowd.stations * 14 < c.guests && c.style !== "seated") {
    advisories.push(
      `${c.guests} guests against ${ops.crowd.stations} serving station${ops.crowd.stations === 1 ? "" : "s"}: expect a queue. One station comfortably serves about fourteen.`,
    );
  }
  if (ops.constraint.pantryOnly) {
    const fresh = shoppingAisleCount(menu, ["produce", "protein", "bakery"]);
    advisories.push(
      `Pantry-only mode declared, but this route still needs ${fresh} fresh line${fresh === 1 ? "" : "s"}. Substitute deliberately or accept one trip.`,
    );
  }
  if (ops.constraint.shoppingTrips <= 0) {
    stops.push({
      code: "SUP-01",
      title: "No shopping trip declared",
      detail: "The route requires ingredients that are not stated as already in the house.",
      correction: "Declare at least one trip, switch on pantry-only mode, or reduce the route.",
    });
  }
  if (ops.constraint.hardCapPerHead !== null && ops.constraint.hardCapPerHead <= 0) {
    stops.push({
      code: "BUD-01",
      title: "Hard per-head cap set to zero",
      detail: "A route cannot be costed against a zero ceiling.",
      correction: "Raise the cap or clear it and use the budget tier.",
    });
  }
  if (ops.constraint.curfew && c.prepWindowH > 6) {
    advisories.push("A curfew is declared against a long prep window. Front-load noisy work and finish the loud stages early.");
  }
  if (c.outdoor && ops.outdoor.weatherRisk === "high") {
    advisories.push("High weather risk outdoors: keep an indoor landing for every hot dish and do not commit the anchor to the grill alone.");
  }
  if (ops.outdoor.transportMin > 0) {
    const fragile = menu.filter((m) => m.dish.tempBand === "hot" && m.dish.holdMin < ops.outdoor.transportMin + 20);
    if (fragile.length)
      advisories.push(
        `${ops.outdoor.transportMin} minutes of transport: ${fragile.map((m) => m.dish.name).join(", ")} will not survive the journey hot. Finish them at the serving point.`,
      );
  }
  if (c.outdoor && !ops.outdoor.shade && ops.outdoor.weatherRisk !== "low") {
    advisories.push("No shade declared: cold dishes come out in relays, not all at once, and nothing sits in sun for more than an hour.");
  }
  if (ops.outdoor.insectPressure) {
    advisories.push("Insect pressure declared: everything sweet or exposed needs a cover, and the sweet course lands late rather than early.");
  }
  if (c.outdoor && !ops.outdoor.water) {
    advisories.push("No outdoor water: stage a rinse bin and a bin bag at the serving point before guests arrive.");
  }
  if (ops.general.dietStrictness === "strict" && c.diets.length > 0) {
    advisories.push("Strict avoidance declared: separate boards, separate utensils and separate serving spoons. Read every label yourself; this tool cannot verify one.");
  }
  if (!ops.general.alcohol) {
    advisories.push("Alcohol-free house: the zero-proof pour is the only pour, and it is treated as the main drink, not a fallback.");
  }
  if (ops.table.tablesideFinishing) {
    advisories.push("Table-side finishing costs you the room for the length of the finish. Assign it to a helper or drop it.");
  }



  // ---- Advisories -------------------------------------------------------
  if (!c.kitchen.dishwasher && c.guests >= 8)
    advisories.push("Hand-wash only at this guest count: stage a soak bin and clear between courses, or the sink becomes the bottleneck.");
  if (c.kitchen.fridge === "tight")
    advisories.push("Tight cold storage: chill drinks in an ice bath rather than the fridge to protect shelf space for made-ahead dishes.");
  if (c.helpers === 0 && c.guests >= 8)
    advisories.push("Solo host above eight guests: everything hot should be finished before the first arrival, not during it.");
  if (c.style === "buffet" || c.style === "grazing")
    advisories.push("Self-service styles consume roughly 10% more than plated portions. Quantities below already include that allowance.");
  if (c.diets.length > 0)
    advisories.push("Dietary categories are planning filters only. Confirm every ingredient label yourself — nothing here is an allergy guarantee.");
  const overCold = gauges.find((g) => g.key === "cold");
  if (overCold && overCold.pct > 90)
    advisories.push("Cold storage is at or beyond capacity. Reduce make-ahead volume or secure a second cold box before shopping.");

  // ---- Timeline ---------------------------------------------------------
  const serviceMin = parseClock(c.serviceTime);
  const timeline: TimelineEntry[] = [];

  menu
    .filter((m) => m.when !== "dayof")
    .forEach((m) => {
      timeline.push({
        phase: m.when === "d2" ? "D-2" : "D-1",
        clock: m.when === "d2" ? "Two days out" : "Day before",
        offsetMin: m.when === "d2" ? -2880 : -1440,
        task: `Cook, cool fast and cold-hold — ${m.batches} batch${m.batches === 1 ? "" : "es"}`,
        dish: m.dish.name,
        minutes: m.dish.activeMin * Math.min(m.batches, 2),
        resource: m.dish.ovenMin > 0 ? "oven" : m.dish.burnerMin > 0 ? "burner" : "hands",
      });
    });

  timeline.push({
    phase: "D-1",
    clock: "Day before",
    offsetMin: -1400,
    task: "Shop the list, decant, label containers by service order",
    dish: "Whole route",
    minutes: 75 + Math.round(c.guests * 2),
    resource: "hands",
  });

  // Greedy day-of scheduler working forward from the start of the window.
  const ovenFree = new Array(Math.max(c.kitchen.ovens, 0)).fill(-windowMin) as number[];
  const burnerFree = new Array(Math.max(c.kitchen.burners, 0)).fill(-windowMin) as number[];
  let handsFree = -windowMin;

  const ordered = [...dayOf].sort(
    (a, b) => b.dish.ovenMin * b.batches - a.dish.ovenMin * a.batches,
  );

  ordered.forEach((m) => {
    const prepStart = handsFree;
    const prepMin = m.dish.activeMin * Math.min(m.batches, 3);
    const prepEnd = prepStart + prepMin;
    handsFree = prepEnd;
    timeline.push({
      phase: "Day of",
      clock: formatClock(serviceMin + prepStart),
      offsetMin: prepStart,
      task: `Prep — ${m.batches} batch${m.batches === 1 ? "" : "es"}`,
      dish: m.dish.name,
      minutes: prepMin,
      resource: "hands",
    });

    const cookMin = (m.dish.ovenMin || m.dish.burnerMin) * (m.dish.ovenMin ? 1 : m.batches);
    if (cookMin > 0) {
      const pool = m.dish.ovenMin > 0 ? ovenFree : burnerFree;
      if (pool.length > 0) {
        let idx = 0;
        let best = pool[0] ?? -windowMin;
        pool.forEach((v, i) => {
          if (v < best) {
            best = v;
            idx = i;
          }
        });
        const start = Math.max(prepEnd, best);
        const end = start + cookMin;
        pool[idx] = end;
        timeline.push({
          phase: "Day of",
          clock: formatClock(serviceMin + start),
          offsetMin: start,
          task: `${m.dish.ovenMin > 0 ? "Oven" : "Stovetop"} — ${cookMin} min, free again at ${formatClock(serviceMin + end)}`,
          dish: m.dish.name,
          minutes: cookMin,
          resource: m.dish.ovenMin > 0 ? "oven" : "burner",
        });
        if (end > 0) {
          advisories.push(
            `${m.dish.name} finishes ${Math.round(end)} minutes after service time as scheduled. Start earlier or move it off the day-of list.`,
          );
        }
      }
    }
  });

  menu
    .filter((m) => m.when !== "dayof" && (m.dish.ovenMin > 0 || m.dish.burnerMin > 0))
    .forEach((m, i) => {
      const start = -50 - i * 12;
      timeline.push({
        phase: "Day of",
        clock: formatClock(serviceMin + start),
        offsetMin: start,
        task: "Temper from cold, reheat to serving temperature, check the centre",
        dish: m.dish.name,
        minutes: 20,
        resource: m.dish.ovenMin > 0 ? "oven" : "burner",
      });
    });

  timeline.sort((a, b) => a.offsetMin - b.offsetMin);

  // Hands-on work is dealt out across the declared crew so nobody arrives to a
  // list that only one person can physically carry.
  const crew = ["Host", ...Array.from({ length: c.helpers }, (_, i) => `Helper ${i + 1}`)];
  let handIdx = 0;
  timeline.forEach((t) => {
    if (t.resource === "hands") {
      t.owner = crew[handIdx % crew.length] ?? "Host";
      handIdx += 1;
    } else {
      t.owner = "Host";
    }
  });

  // ---- Service sequence -------------------------------------------------
  const service: TimelineEntry[] = [];
  const push = (off: number, task: string, dish: string, resource: TimelineEntry["resource"]) =>
    service.push({
      phase: "Service",
      clock: formatClock(serviceMin + off),
      offsetMin: off,
      task,
      dish,
      minutes: 0,
      resource,
    });

  push(-45, "Chill drinks, set glassware, clear the landing zone", "Service kit", "cold");
  const boards = menu.filter((m) => m.dish.course === "board");
  if (boards.length) push(-20, "Boards out before the first arrival", boards.map((b) => b.dish.name).join(" · "), "table");
  push(-10, "Zero-proof poured and visible alongside everything else", "Zero-proof house pour", "table");
  push(0, c.style === "seated" ? "Guests to the table" : "Open the spread", c.label, "table");
  const starters = menu.filter((m) => m.dish.course === "starter");
  if (starters.length) push(8, "Starter out", starters.map((s) => s.dish.name).join(" · "), "table");
  const anchors = menu.filter((m) => m.dish.course === "anchor");
  if (anchors.length) push(c.style === "seated" ? 28 : 18, "Anchor out — carve or set on the pass", anchors.map((a) => a.dish.name).join(" · "), "table");
  const sides = menu.filter((m) => m.dish.course === "side" || m.dish.course === "bread");
  if (sides.length) push(c.style === "seated" ? 30 : 20, "Sides and bread land with the anchor", sides.map((s) => s.dish.name).join(" · "), "table");
  push(c.style === "seated" ? 62 : 55, "Clear, reset, refill water and zero-proof", "Whole table", "hands");
  const sweets = menu.filter((m) => m.dish.course === "sweet");
  if (sweets.length) push(c.style === "seated" ? 78 : 70, "Sweet out", sweets.map((s) => s.dish.name).join(" · "), "table");
  push(c.style === "seated" ? 105 : 95, "Soak bin loaded, leftovers cooled and covered within two hours", "Recovery", "cold");

  // ---- Shopping ---------------------------------------------------------
  const buffer = c.style === "buffet" || c.style === "grazing" ? 1.1 : 1.0;
  const acc = new Map<string, ShoppingLine>();
  menu.forEach((m) => {
    m.dish.ingredients.forEach((ing) => {
      const key = `${ing.item}|${ing.unit}`;
      const qty = ing.perGuest * c.guests * buffer;
      const existing = acc.get(key);
      if (existing) {
        existing.qty += qty;
        if (!existing.forDishes.includes(m.dish.name)) existing.forDishes.push(m.dish.name);
      } else {
        acc.set(key, { item: ing.item, qty, unit: ing.unit, aisle: ing.aisle, forDishes: [m.dish.name] });
      }
    });
  });

  const round = (line: ShoppingLine) => {
    const discrete = ["ea", "bottle", "pack", "glass", "clove", "bunch"];
    if (discrete.includes(line.unit)) return Math.ceil(line.qty);
    if (line.unit === "g" || line.unit === "ml") return Math.round(line.qty / 10) * 10;
    return Math.round(line.qty * 10) / 10;
  };

  const shopping = [...acc.values()]
    .map((l) => ({ ...l, qty: round(l) }))
    .sort((a, b) => a.aisle.localeCompare(b.aisle) || a.item.localeCompare(b.item));

  // ---- Cost -------------------------------------------------------------
  const foodMenu = menu.filter((m) => m.dish.course !== "drink" || true);
  const costPerHead =
    Math.round(foodMenu.reduce((s, m) => s + cost(m.dish) * volume, 0) * 100) / 100;
  const costTotal = Math.round(costPerHead * c.guests);
  const costCeiling = BUDGET_CEILING[c.budgetTier];
  if (costPerHead > costCeiling) {
    advisories.push(
      `Indicative cost is about ${costPerHead.toFixed(2)} per head against a ${BUDGET_LABELS[c.budgetTier].toLowerCase()} ceiling of ${costCeiling}. Drop the most expensive dish, or raise the tier deliberately rather than by accident.`,
    );
  }

  // ---- Menu balance -----------------------------------------------------
  const balanceNotes: string[] = [];
  let balance = 100;
  const eatable = menu.filter((m) => m.dish.course !== "drink" && m.dish.ingredients.length > 0);
  const methodCounts = new Map<string, number>();
  const tempCounts = new Map<string, number>();
  eatable.forEach((m) => {
    methodCounts.set(m.dish.method ?? "raw", (methodCounts.get(m.dish.method ?? "raw") ?? 0) + 1);
    tempCounts.set(m.dish.tempBand ?? "hot", (tempCounts.get(m.dish.tempBand ?? "hot") ?? 0) + 1);
  });
  methodCounts.forEach((n, k) => {
    if (n >= 3) {
      balance -= (n - 2) * 12;
      balanceNotes.push(`${n} dishes share the same method (${k}). The table will read flat.`);
    }
  });
  tempCounts.forEach((n, k) => {
    if (n >= 4) {
      balance -= (n - 3) * 10;
      balanceNotes.push(`${n} dishes land in the same temperature band (${k}). Add one contrast.`);
    }
  });
  const dayOfShare = eatable.length ? dayOf.length / eatable.length : 0;
  if (dayOfShare > 0.5) {
    balance -= Math.round((dayOfShare - 0.5) * 80);
    balanceNotes.push("More than half the route is day-of work. Move one dish back a day.");
  }
  const offSeason = eatable.filter(
    (m) => !(m.dish.season ?? ["year-round"]).some((s) => s === "year-round" || s === c.season),
  );
  if (offSeason.length) {
    balance -= offSeason.length * 8;
    balanceNotes.push(
      `Out of season for ${c.season}: ${offSeason.map((m) => m.dish.name).join(", ")}. Expect weaker produce and a higher price.`,
    );
  }
  balance = Math.max(0, Math.min(100, balance));

  if (c.kids) {
    const friendly = eatable.filter((m) => m.dish.kidFriendly).length;
    advisories.push(
      friendly >= 2
        ? `${friendly} dishes on this route are reliably eaten by children. No separate menu required.`
        : "Children are present but only one dish on this route is a safe bet. Add bread, a plain side, or accept a second small plate.",
    );
  }
  if (c.outdoor) {
    const risky = eatable.filter((m) => m.dish.tempBand === "cold" && !m.dish.outdoorSafe);
    if (risky.length)
      advisories.push(
        `Serving outdoors: ${risky.map((m) => m.dish.name).join(", ")} should stay inside on ice until the moment they are wanted. Two hours out of the fridge is the limit.`,
      );
  }
  if (c.leftovers === "deliberate")
    advisories.push("Deliberate leftovers: quantities carry a 25% surplus. Cool within two hours, label with the date, and plan the second meal now.");
  if (c.leftovers === "none")
    advisories.push("Zero-leftover target: quantities are cut close. There is no margin for a late extra guest.");

  // ---- Score ------------------------------------------------------------
  const overloadPenalty = gauges.reduce((s, g) => s + Math.max(0, g.pct - 82) * 0.9, 0);
  const idlePenalty = gauges.reduce((s, g) => s + (g.pct < 25 ? 3 : 0), 0);
  const balancePenalty = (100 - balance) * 0.12;
  const feasibility = Math.max(
    0,
    Math.min(
      100,
      Math.round(100 - overloadPenalty - idlePenalty - balancePenalty - stops.length * 22),
    ),
  );
  const verdict: LoadLabel =
    stops.length > 0 || feasibility < 40
      ? "overloaded"
      : feasibility < 66
        ? "tight"
        : feasibility > 92
          ? "under-used"
          : "controlled";

  const makeAheadShare = menu.length ? menu.filter((m) => m.when !== "dayof").length / menu.length : 0;

  return {
    conditions: c,
    stops,
    advisories: [...new Set(advisories)],
    menu,
    gauges,
    feasibility,
    verdict,
    timeline,
    shopping,
    service,
    makeAheadShare,
    handsOnMin: Math.round(handsUsed),
    costPerHead,
    costTotal,
    costCeiling,
    balance,
    balanceNotes,
    signature: `${c.guests}·${c.style}·${c.season}·b${c.budgetTier}·${c.kitchen.ovens}o${c.kitchen.burners}b·${c.diets.slice().sort().join("+") || "no filters"}·${c.prepWindowH}h`,
  };
}

export const DEFAULT_CONDITIONS: Conditions = {
  label: "Winter table",
  shape: "dinner",
  style: "seated",
  guests: 8,
  helpers: 1,
  serviceTime: "19:00",
  prepWindowH: 5,
  ambition: 2,
  diets: [],
  season: "winter",
  budgetTier: 2,
  kids: false,
  outdoor: false,
  leftovers: "some",
  kitchen: {
    ovens: 1,
    burners: 4,
    grill: false,
    dishwasher: true,
    fridge: "normal",
    counter: "medium",
    seats: 8,
  },
};

