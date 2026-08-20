import type { Conditions, LoadGauge } from "./types";

/**
 * Plain-language explainers. Every input the host can move should say what it
 * changes inside the engine — no hidden mechanics, no unexplained scoring.
 */

export const EXPLAIN = {
  shape:
    "Sets the character of the occasion. Each fixture dish declares the shapes it reads correctly in, so a brunch route and a reception route draw from different halves of the library.",
  style:
    "Drives portioning and choreography. Seated is capped by real seats and plated in courses. Buffet and grazing carry a 10% self-service allowance and spread the service sequence. Standing removes the anchor entirely.",
  guests:
    "The single biggest multiplier. Guests set batch counts, shopping quantities, wash-up throughput and, for seated service, a hard stop against declared seats.",
  seats:
    "Real chairs at a real table. Seated service above this number is a hard stop — the engine will not invent seating.",
  time: "Service time anchors the prep clock. The day-of window is the number of hours you genuinely have free before it, and it becomes the capacity ceiling for oven, stovetop and labour gauges.",
  kitchen:
    "Fail-closed equipment reality. Zero ovens removes every oven dish. Fewer burners penalises stovetop-heavy routes. Fridge size caps how much can be made ahead, and counter size caps how many day-of dishes can be worked at once.",
  helpers:
    "Each helper raises the labour ceiling by roughly 85% of one pair of hands and adds wash-up throughput. Helpers are also dealt named tasks in the prep clock.",
  ambition:
    "Course count and hands-on tolerance. Restrained favours make-ahead dishes and fewer sides; full table adds courses and accepts more day-of work — which shows up immediately in the labour gauge.",
  season:
    "Fixtures declare the seasons they read correctly in. Off-season dishes are scored down and, if they still make the route, they are named in the balance notes with a produce and price warning.",
  budget:
    "An indicative per-head ceiling, not live prices. The engine trims expensive dishes harder at lower tiers and flags the route when the estimate goes over.",
  leftovers:
    "Sets batch volume honestly. None cuts to 0.95x with no margin for a late guest, some plans 1.08x, deliberate carries a 25% surplus and adds cooling and labelling advice.",
  drinks:
    "Declared pour for the table. Wine, cider and mixed always include an equal-status zero-proof. Zero-proof is the only pour on an alcohol-free table. A wine route against an alcohol-free filter is a hard stop — nothing is dropped silently.",
  room: "Children shift scoring towards reliably-eaten dishes. Outdoor space allows grill routes and adds a two-hour cold-holding warning for anything that should not sit in warm air.",
  diets:
    "Planning filters. They remove conflicting fixture dishes from selection. They do not verify labels, cross-contact or supplier changes, and they are never an allergy guarantee.",
  table:
    "Tables and seats per table set real seated capacity, which is a hard stop. Course count decides how many plates the engine builds. Plated service costs about 2.6 hands-on minutes per guest, family style 1.5, passed 3.2 — and table-side finishing adds more on top.",
  crowd:
    "How a standing room actually flows. Standing share sets seating pressure, arrival spread is checked against how long each dish holds, and stations cap throughput at roughly fourteen guests each. Refill cadence adds host labour.",
  constraint:
    "Declared limits that tighten the kitchen before anything is modelled: single-burner and no-oven modes override the equipment above, limited power caps concurrent heat, cool boxes add cold capacity, sink size scales wash-up throughput, and a hard per-head cap becomes a stop rather than a warning.",
  outdoorOps:
    "Grill, smoker and fire pit each count as outdoor heat and open grill routes. Transport minutes are checked against how long hot dishes hold. Weather risk, shade, water and insect pressure change the service advice and the order things come out.",
  general:
    "Skill scales every hands-on estimate (cautious 1.3x, practised 0.85x). Turning alcohol off applies the alcohol-free filter to the whole route. Cleanup window becomes its own gauge, and strict dietary avoidance adds separate-equipment guidance.",
} as const satisfies Record<string, string>;


export const GLOSSARY: { term: string; body: string }[] = [
  {
    term: "Feasibility index",
    body: "0–100. Starts at 100 and subtracts overload above 82% on any gauge, idle penalties for badly under-used capacity, a menu-balance penalty, and 22 points per hard stop.",
  },
  {
    term: "Hard stop",
    body: "A constraint the engine refuses to plan around: more guests than seats, oven dishes without an oven, a cookout without a grill, a wine pour against an alcohol-free filter, or labour beyond survivable. Each carries a correction path rather than a silent substitution.",
  },
  {
    term: "Load gauge",
    body: "Demand against declared capacity inside the day-of window. Under 32% is under-used, 78% and above is tight, over 100% is overloaded.",
  },
  {
    term: "Menu balance",
    body: "Penalises three dishes sharing one cooking method, four in one temperature band, more than half the route landing on the day, and anything out of season.",
  },
  {
    term: "Made ahead",
    body: "Share of the route completed before the day. Higher is calmer, but it is bounded by cold storage — the fridge gauge is the real limit.",
  },
  {
    term: "Indicative cost",
    body: "Fixture-declared planning cost per guest, multiplied by batch volume. Not a quote, not live pricing, and not adjusted for where you shop.",
  },
];

/** What to actually do when a gauge is running hot. */
export function relief(g: LoadGauge, c: Conditions): string | null {
  if (g.pct < 78) return null;
  switch (g.key) {
    case "oven":
      return c.kitchen.ovens < 2
        ? "Move one oven dish to the day before and reheat, or swap it for a stovetop route. A second oven is the only other fix."
        : "Stagger the two heaviest trays: start the longest at the top of the window and hold it covered.";
    case "burner":
      return "Two burner dishes can usually share one pan sequence. Otherwise move the longest simmer to the day before.";
    case "cold":
      return "Chill drinks in an ice bath, decant into flat containers, and cut one make-ahead dish back to day-of.";
    case "counter":
      return "Clear the landing zone before you start, stage a folding surface, and finish one dish completely before opening the next.";
    case "hands":
      return c.helpers === 0
        ? "Add one helper, extend the window, or cut a course. Solo hosting at this load fails in the last hour."
        : "Deal the prep clock out by name — the tasks are already assigned — and move one dish back a day.";
    case "wash":
      return c.kitchen.dishwasher
        ? "Run a load between courses and stage a soak bin for anything that will not fit."
        : "Hand-wash only: soak bin from the start, serve on fewer vessels, and clear between courses rather than at the end.";
    case "table":
      return "Reduce guests, add real seats, or move to buffet or grazing service.";
    case "stations":
      return "Add a second serving point, or stage the release so the queue never forms in one place.";
    case "cleanup":
      return "Extend the recovery window, serve on fewer vessels, or clear in waves during service rather than after it.";
    default:
      return null;
  }
}

