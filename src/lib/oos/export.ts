import type { Plan } from "./types";

/** Hand-off formats. Everything leaves the browser as a file you own. */

export function download(filename: string, mime: string, body: string) {
  const blob = new Blob([body], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function slug(s: string): string {
  return (s || "occasion").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

export function planMarkdown(plan: Plan): string {
  const c = plan.conditions;
  const L: string[] = [];
  L.push(`# ${c.label || "Occasion route"}`);
  L.push("");
  L.push(`_${plan.signature}_`);
  L.push("");
  L.push(`**Feasibility ${plan.feasibility} · ${plan.verdict}** · ${c.guests} guests · ${c.style} · service ${c.serviceTime}`);
  L.push(`Indicative cost ${plan.costPerHead.toFixed(2)}/head (${plan.costTotal} total, ceiling ${plan.costCeiling}) · balance ${plan.balance} · ${Math.round(plan.makeAheadShare * 100)}% made ahead · ${plan.handsOnMin} hands-on minutes`);
  L.push("");
  if (plan.stops.length) {
    L.push("## Hard stops");
    plan.stops.forEach((s) => L.push(`- **${s.code} — ${s.title}.** ${s.detail} _Correction:_ ${s.correction}`));
    L.push("");
  }
  L.push("## Route");
  plan.menu.forEach((m) =>
    L.push(`- **${m.dish.name}** (${m.dish.course}) — ${m.batches} batch${m.batches === 1 ? "" : "es"}, serves ${m.serves}, ${m.when === "d2" ? "two days out" : m.when === "d1" ? "day before" : "day of"}. ${m.dish.note}`),
  );
  L.push("");
  L.push("## Load");
  plan.gauges.forEach((g) => L.push(`- ${g.name}: ${g.used}/${g.capacity} ${g.unit} — ${g.pct}% (${g.label})`));
  L.push("");
  L.push("## Prep clock");
  plan.timeline.forEach((t) => L.push(`- ${t.clock} · ${t.phase} · ${t.owner ?? "Host"} — ${t.dish}: ${t.task}${t.minutes ? ` (${t.minutes} min)` : ""}`));
  L.push("");
  L.push("## Service sequence");
  plan.service.forEach((s) => L.push(`- ${s.clock} — ${s.task} (${s.dish})`));
  L.push("");
  L.push("## Shopping");
  plan.shopping.forEach((s) => L.push(`- [ ] ${s.item} — ${s.qty} ${s.unit} _(${s.aisle}; ${s.forDishes.join(", ")})_`));
  if (plan.advisories.length) {
    L.push("");
    L.push("## Advisories");
    plan.advisories.forEach((a) => L.push(`- ${a}`));
  }
  L.push("");
  L.push("---");
  L.push("Educational planning only. Fixture menus, not tested recipes. Dietary categories are planning filters and carry no allergen safety guarantee.");
  return L.join("\n");
}

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export function shoppingCsv(plan: Plan): string {
  const rows = [["aisle", "item", "quantity", "unit", "for"], ...plan.shopping.map((s) => [s.aisle, s.item, String(s.qty), s.unit, s.forDishes.join("; ")])];
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export function timelineCsv(plan: Plan): string {
  const rows = [
    ["phase", "clock", "owner", "dish", "task", "minutes", "resource"],
    ...plan.timeline.map((t) => [t.phase, t.clock, t.owner ?? "Host", t.dish, t.task, String(t.minutes), t.resource]),
  ];
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

function icsStamp(d: Date): string {
  return `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");

/**
 * Prep clock as a calendar feed. `serviceDate` is the day of the occasion,
 * ISO yyyy-mm-dd; offsets are applied relative to declared service time.
 */
export function planIcs(plan: Plan, serviceDate: string): string {
  const c = plan.conditions;
  const parts = c.serviceTime.split(":");
  const base = new Date(`${serviceDate}T00:00:00`);
  base.setHours(Number(parts[0] ?? 19), Number(parts[1] ?? 0), 0, 0);
  const now = icsStamp(new Date());

  const events = [...plan.timeline, ...plan.service].map((t, i) => {
    const start = new Date(base.getTime() + t.offsetMin * 60000);
    const end = new Date(start.getTime() + Math.max(t.minutes, 10) * 60000);
    return [
      "BEGIN:VEVENT",
      `UID:oos-${slug(c.label)}-${i}@saltnotes`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(end)}`,
      `SUMMARY:${esc(`${t.dish} — ${t.task}`)}`,
      `DESCRIPTION:${esc(`${t.phase} · ${t.resource}${t.owner ? ` · ${t.owner}` : ""}`)}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Salty & Clever//Occasion Operating System//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
}

export function planJson(plan: Plan): string {
  return JSON.stringify(
    {
      generatedBy: "Occasion Operating System",
      disclaimer: "Educational planning only. Dietary categories are planning filters, not allergen guarantees.",
      conditions: plan.conditions,
      signature: plan.signature,
      feasibility: plan.feasibility,
      verdict: plan.verdict,
      cost: { perHead: plan.costPerHead, total: plan.costTotal, ceiling: plan.costCeiling },
      balance: { score: plan.balance, notes: plan.balanceNotes },
      stops: plan.stops,
      advisories: plan.advisories,
      menu: plan.menu.map((m) => ({ id: m.dish.id, name: m.dish.name, course: m.dish.course, batches: m.batches, serves: m.serves, when: m.when })),
      gauges: plan.gauges,
      timeline: plan.timeline,
      service: plan.service,
      shopping: plan.shopping,
    },
    null,
    2,
  );
}
