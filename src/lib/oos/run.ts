import { buildPlan } from "./engine";
import type { Conditions, Dish, LoadGauge, Plan } from "./types";

/**
 * Run orchestration.
 *
 * Building a plan is not a hidden recalculation: it is a run with four stages,
 * each of which does real work and reports what it produced. The engine itself
 * stays pure — every stage calls `buildPlan` and reads its own slice of the
 * result, so stepping through a run cannot show anything the finished plan
 * would not also show. Timings are measured, not simulated.
 */

export type StageId = "menu" | "load" | "schedule" | "cost";

export const STAGES: StageId[] = ["menu", "load", "schedule", "cost"];

export interface StageReport {
  id: StageId;
  /** wall-clock milliseconds spent computing this stage */
  ms: number;
  /** one line of fact: what the stage produced */
  headline: string;
  /** the constraints, stops or observations this stage raised */
  notes: string[];
}

export interface RunRecord {
  id: string;
  at: number;
  label: string;
  signature: string;
  feasibility: number;
  balance: number;
  verdict: string;
  stops: number;
  /** the gauge under most pressure at the end of the run */
  binding: string;
  conditions: Conditions;
}

/** The gauge carrying the most load. Null when nothing is measurable. */
export function bindingGauge(plan: Plan): LoadGauge | null {
  let worst: LoadGauge | null = null;
  for (const g of plan.gauges) {
    if (g.capacity <= 0) continue;
    if (!worst || g.pct > worst.pct) worst = g;
  }
  return worst;
}

function pct(n: number): string {
  return n > 400 ? "over 400%" : `${n}%`;
}

/** Run one stage against the real engine and report only that stage's output. */
export function executeStage(
  id: StageId,
  conditions: Conditions,
  library: Dish[],
): { report: StageReport; plan: Plan } {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const plan = buildPlan(conditions, library);
  const ended = typeof performance !== "undefined" ? performance.now() : Date.now();
  const ms = Math.max(1, Math.round(ended - started));

  let headline = "";
  let notes: string[] = [];

  if (id === "menu") {
    headline = `${plan.menu.length} dishes selected, ${plan.menu.reduce((n, m) => n + m.batches, 0)} batches`;
    notes = plan.menu.slice(0, 6).map((m) => `${m.dish.name} — ${m.dish.course}, ${m.batches}× serves ${m.serves}`);
    if (plan.menu.length > 6) notes.push(`+${plan.menu.length - 6} more on the route`);
    if (plan.menu.length === 0) notes.push("No dish in the library survives the current filters.");
  } else if (id === "load") {
    const b = bindingGauge(plan);
    headline = b ? `Binding constraint: ${b.name} at ${pct(b.pct)}` : "No capacity declared to measure against";
    notes = plan.gauges.map((g) => `${g.name}: ${g.used}/${g.capacity} ${g.unit} · ${pct(g.pct)} · ${g.label}`);
    for (const s of plan.stops) notes.push(`STOP ${s.code} — ${s.title}`);
  } else if (id === "schedule") {
    const dayOf = plan.timeline.filter((t) => t.phase === "Day of").length;
    headline = `${plan.timeline.length} prep tasks, ${plan.service.length} service moves, ${dayOf} on the day`;
    notes = [
      `Hands-on ${Math.round(plan.handsOnMin)} min across ${conditions.helpers + 1} pair${conditions.helpers === 0 ? "" : "s"} of hands`,
      `${Math.round(plan.makeAheadShare * 100)}% of the route completes before the day`,
      plan.timeline[0] ? `First task at ${plan.timeline[0].clock}` : "Nothing scheduled",
    ];
  } else {
    headline = `${plan.costPerHead.toFixed(2)} per head against a ${plan.costCeiling} ceiling · balance ${plan.balance}/100`;
    notes = [
      `Indicative total ${plan.costTotal}`,
      ...plan.balanceNotes,
      ...plan.advisories.slice(0, 4),
    ];
  }

  return { report: { id, ms, headline, notes }, plan };
}

export function runRecord(plan: Plan): RunRecord {
  const b = bindingGauge(plan);
  return {
    id: `${Date.now()}-${Math.round(plan.feasibility)}`,
    at: Date.now(),
    label: plan.conditions.label,
    signature: plan.signature,
    feasibility: plan.feasibility,
    balance: plan.balance,
    verdict: plan.verdict,
    stops: plan.stops.length,
    binding: b ? `${b.name} ${pct(b.pct)}` : "—",
    conditions: plan.conditions,
  };
}
