import { useState } from "react";
import type { Plan } from "@/lib/oos/types";
import { download, planIcs, planJson, planMarkdown, shoppingCsv, slug, timelineCsv } from "@/lib/oos/export";

const btn =
  "border border-border bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground";

/** Everything the host needs to carry the plan out of the browser. */
export function HandoffBar({ plan }: { plan: Plan }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const name = slug(plan.conditions.label);

  return (
    <div className="no-print border border-border bg-secondary px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="rule-label">Hand-off</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={() => download(`${name}-packet.md`, "text/markdown", planMarkdown(plan))}>
            Markdown packet
          </button>
          <button type="button" className={btn} onClick={() => download(`${name}-shopping.csv`, "text/csv", shoppingCsv(plan))}>
            Shopping CSV
          </button>
          <button type="button" className={btn} onClick={() => download(`${name}-prep-clock.csv`, "text/csv", timelineCsv(plan))}>
            Prep clock CSV
          </button>
          <button type="button" className={btn} onClick={() => download(`${name}-plan.json`, "application/json", planJson(plan))}>
            JSON
          </button>
          <button type="button" className={btn} onClick={() => planPdf(plan)}>
            Packet PDF
          </button>
          <button type="button" className={btn} onClick={() => window.print()}>
            Print packet
          </button>
          <button
            type="button"
            className={`${btn} border-foreground`}
            onClick={() => {
              stashMenu(plan);
              navigate({ to: "/menu" });
            }}
          >
            Send to menu builder
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground" htmlFor="oos-ics-date">
            Occasion date
          </label>
          <input
            id="oos-ics-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-border bg-card px-2 py-1.5 font-mono text-xs"
          />
          <button
            type="button"
            className={btn}
            onClick={() => download(`${name}-prep.ics`, "text/calendar", planIcs(plan, date))}
          >
            Calendar .ics
          </button>
        </div>
      </div>
      <p className="mt-3 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
        Files are generated in your browser and never uploaded. The calendar feed places every prep and
        service step relative to the declared service time on the date you choose.
      </p>
    </div>
  );
}
