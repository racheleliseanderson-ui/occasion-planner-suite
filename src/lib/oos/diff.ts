import type { Conditions } from "./types";

/**
 * What loading a preset would actually change. Shown before it is applied, so
 * a host never loses a carefully tuned condition by accident.
 */

export interface DiffLine {
  field: string;
  from: string;
  to: string;
}

const LABELS: Partial<Record<keyof Conditions, string>> = {
  label: "Occasion",
  shape: "Shape",
  style: "Service style",
  guests: "Guests",
  helpers: "Helpers",
  serviceTime: "Service time",
  prepWindowH: "Day-of window",
  ambition: "Ambition",
  diets: "Dietary filters",
  kitchen: "Kitchen",
  season: "Season",
  budgetTier: "Budget tier",
  kids: "Children",
  outdoor: "Outdoor space",
  leftovers: "Leftovers",
  ops: "Operating conditions",
};

function show(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "none";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "object") return "detailed settings";
  return String(v);
}

export function diffConditions(current: Conditions, next: Conditions): DiffLine[] {
  const keys = Object.keys(LABELS) as (keyof Conditions)[];
  const out: DiffLine[] = [];
  for (const key of keys) {
    const a = current[key];
    const b = next[key];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    out.push({ field: LABELS[key] ?? String(key), from: show(a), to: show(b) });
  }
  return out;
}
