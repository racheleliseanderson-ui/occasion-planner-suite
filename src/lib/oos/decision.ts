import { buildPlan } from "./engine";
import { bindingGauge } from "./run";
import type { Conditions, Dish, LoadLabel, Plan } from "./types";

/**
 * The decision packet: a short, defensible record of why this route was taken.
 *
 * Everything here is derived from real re-runs of the engine. A lever is not a
 * guess about what might help — the alternative conditions are actually built
 * and their verdict reported, including when they make the evening worse.
 */

export interface Assumption {
  label: string;
  value: string;
}

export interface Lever {
  label: string;
  /** what changes, stated plainly */
  change: string;
  feasibility: number;
  verdict: LoadLabel;
  stops: number;
  /** feasibility delta against the chosen route */
  delta: number;
  /** true when the change clears every hard stop the chosen route carries */
  clearsStops: boolean;
}

export interface DecisionRecord {
  label: string;
  signature: string;
  at: number;
  verdict: LoadLabel;
  feasibility: number;
  balance: number;
  /** the single sentence that justifies the verdict */
  why: string;
  binding: { name: string; used: number; capacity: number; unit: string; pct: number; margin: string } | null;
  stops: { code: string; title: string; correction: string }[];
  assumptions: Assumption[];
  levers: Lever[];
  /** what is being accepted by proceeding */
  accepted: string[];
}

function withOps(c: Conditions, patch: Partial<Conditions>): Conditions {
  return { ...c, ...patch };
}

const CANDIDATES: { label: string; change: string; patch: (c: Conditions) => Partial<Conditions> }[] = [
  {
    label: "Two fewer guests",
    change: "Guest count down by two; everything else held.",
    patch: (c) => ({ guests: Math.max(1, c.guests - 2) }),
  },
  {
    label: "One more pair of hands",
    change: "A second helper joins for the whole day-of window.",
    patch: (c) => ({ helpers: Math.min(6, c.helpers + 1) }),
  },
  {
    label: "One more hour",
    change: "Day-of window extended by an hour before service.",
    patch: (c) => ({ prepWindowH: Math.min(14, c.prepWindowH + 1) }),
  },
  {
    label: "Lower ambition",
    change: "Ambition dropped one step: fewer moving parts, shorter route.",
    patch: (c) => ({ ambition: Math.max(1, c.ambition - 1) as Conditions["ambition"] }),
  },
];

function marginText(used: number, capacity: number, unit: string): string {
  const left = Math.round((capacity - used) * 10) / 10;
  if (left >= 0) return `${left} ${unit} of headroom`;
  return `${Math.abs(left)} ${unit} beyond capacity`;
}

export function buildDecision(plan: Plan, library: Dish[]): DecisionRecord {
  const c = plan.conditions;
  const g = bindingGauge(plan);

  const levers: Lever[] = CANDIDATES.map((cand) => {
    const alt = buildPlan(withOps(c, cand.patch(c)), library);
    return {
      label: cand.label,
      change: cand.change,
      feasibility: alt.feasibility,
      verdict: alt.verdict,
      stops: alt.stops.length,
      delta: alt.feasibility - plan.feasibility,
      clearsStops: plan.stops.length > 0 && alt.stops.length === 0,
    };
  }).sort((a, b) => b.delta - a.delta);

  const why = plan.stops.length
    ? `Blocked: ${plan.stops.length} hard stop${plan.stops.length === 1 ? "" : "s"} stand between these conditions and a servable route.`
    : g
      ? `Feasibility ${plan.feasibility}/100 — ${plan.verdict}. ${g.name} is the binding constraint at ${g.pct > 400 ? "over 400%" : `${g.pct}%`} of declared capacity; every other gauge sits below it.`
      : `Feasibility ${plan.feasibility}/100 — ${plan.verdict}. No declared capacity binds this route.`;

  const assumptions: Assumption[] = [
    { label: "Guests", value: `${c.guests} at a ${c.style} ${c.shape}` },
    { label: "Service", value: `${c.serviceTime}, ${c.prepWindowH}h day-of window` },
    { label: "Hands", value: c.helpers === 0 ? "Host alone" : `Host plus ${c.helpers} helper${c.helpers === 1 ? "" : "s"}` },
    {
      label: "Equipment",
      value: `${c.kitchen.ovens} oven${c.kitchen.ovens === 1 ? "" : "s"}, ${c.kitchen.burners} burners, ${c.kitchen.fridge} fridge, ${c.kitchen.counter} counter${c.kitchen.grill ? ", grill" : ""}`,
    },
    { label: "Budget", value: `${plan.costPerHead.toFixed(2)} per head against a ${plan.costCeiling} ceiling` },
    { label: "Filters", value: c.diets.length ? c.diets.join(", ") : "none declared" },
    { label: "Season", value: c.season },
    { label: "Library", value: `${library.length} dishes available to the engine` },
  ];

  const accepted: string[] = [];
  if (g && g.pct > 100) accepted.push(`${g.name} runs beyond declared capacity — the route depends on that gauge being understated.`);
  if (plan.makeAheadShare < 0.35) accepted.push(`Only ${Math.round(plan.makeAheadShare * 100)}% of the work happens before the day; the day-of window carries the rest.`);
  if (plan.costPerHead > plan.costCeiling) accepted.push("Indicative cost exceeds the declared ceiling.");
  if (plan.balance < 55) accepted.push(`Menu balance is ${plan.balance}/100: methods or temperatures repeat.`);
  if (accepted.length === 0) accepted.push("No constraint is being overrun at the declared figures.");

  return {
    label: c.label,
    signature: plan.signature,
    at: Date.now(),
    verdict: plan.verdict,
    feasibility: plan.feasibility,
    balance: plan.balance,
    why,
    binding: g
      ? {
          name: g.name,
          used: g.used,
          capacity: g.capacity,
          unit: g.unit,
          pct: g.pct,
          margin: marginText(g.used, g.capacity, g.unit),
        }
      : null,
    stops: plan.stops.map((s) => ({ code: s.code, title: s.title, correction: s.correction })),
    assumptions,
    levers,
    accepted,
  };
}

/** Markdown hand-off of the same record. */
export function decisionMarkdown(d: DecisionRecord): string {
  const L: string[] = [];
  L.push(`# Decision packet — ${d.label}`, "", `**Verdict:** ${d.verdict} · feasibility ${d.feasibility}/100 · balance ${d.balance}/100`, "", d.why, "");
  if (d.binding) {
    L.push("## Binding constraint", "", `${d.binding.name}: ${d.binding.used}/${d.binding.capacity} ${d.binding.unit} (${d.binding.pct}%) — ${d.binding.margin}`, "");
  }
  if (d.stops.length) {
    L.push("## Hard stops", "");
    for (const s of d.stops) L.push(`- **${s.code} ${s.title}** — correction: ${s.correction}`);
    L.push("");
  }
  L.push("## Assumptions", "");
  for (const a of d.assumptions) L.push(`- ${a.label}: ${a.value}`);
  L.push("", "## What would change the verdict", "");
  for (const l of d.levers) {
    L.push(`- **${l.label}** — ${l.change} Feasibility ${l.feasibility}/100 (${l.delta >= 0 ? "+" : ""}${l.delta}), ${l.stops} hard stop${l.stops === 1 ? "" : "s"}.`);
  }
  L.push("", "## Accepted by proceeding", "");
  for (const a of d.accepted) L.push(`- ${a}`);
  L.push("", `Signature ${d.signature} · recorded ${new Date(d.at).toISOString()}`, "", "Educational planning record. Dietary categories are filters, not allergen guarantees. Costs are indicative.");
  return L.join("\n");
}
