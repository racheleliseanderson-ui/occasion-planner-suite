import type { LoadGauge, LoadLabel, Plan } from "@/lib/oos/types";
import { cn } from "@/lib/utils";

const LABEL_TEXT: Record<LoadLabel, string> = {
  "under-used": "Headroom",
  controlled: "Controlled",
  tight: "Tight",
  overloaded: "Overloaded",
};

export function signalClass(label: LoadLabel, kind: "text" | "bg" | "border" = "text") {
  const map: Record<LoadLabel, string> = {
    "under-used": "signal-clear",
    controlled: "signal-controlled",
    tight: "signal-tight",
    overloaded: "signal-over",
  };
  return `${kind}-${map[label]}`;
}

export function GaugeRow({ g }: { g: LoadGauge }) {
  const width = Math.max(3, Math.min(100, g.pct));
  return (
    <div className="border-t border-border py-4 first:border-t-0">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">{g.name}</span>
        <span className={cn("font-mono text-xs uppercase tracking-widest", signalClass(g.label))}>
          {LABEL_TEXT[g.label]} · {g.pct > 400 ? "—" : `${g.pct}%`}
        </span>
      </div>
      <div className="mt-2 h-[3px] w-full bg-muted">
        <div
          className={cn("h-full", signalClass(g.label, "bg"))}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 font-mono text-[11px] text-muted-foreground">
        <span>
          {g.used} / {g.capacity} {g.unit}
        </span>
        <span className="max-w-[24rem] text-right">{g.detail}</span>
      </div>
    </div>
  );
}

export function VerdictBlock({ plan }: { plan: Plan }) {
  return (
    <div className="bg-ink text-ink-foreground grain">
      <div className="grid gap-8 px-6 py-8 sm:grid-cols-[auto_1fr] sm:px-8">
        <div>
          <span className="rule-label text-ink-muted">Feasibility index</span>
          <p className="font-display text-7xl leading-none tabular-nums">{plan.feasibility}</p>
          <p className={cn("mt-2 font-mono text-xs uppercase tracking-[0.2em]", signalClass(plan.verdict))}>
            {LABEL_TEXT[plan.verdict]}
          </p>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-ink-muted">
          <p className="text-ink-foreground">
            {plan.stops.length > 0
              ? "The route is blocked. Hard constraints are listed below and nothing has been substituted for them."
              : plan.verdict === "tight"
                ? "The route fits, but with little margin. Any late guest, delayed arrival, or extra dish will cost you."
                : plan.verdict === "under-used"
                  ? "The route is comfortably inside your equipment and time. You have room for one more dish if you want it."
                  : "The route fits your declared equipment, time, and hands with usable margin."}
          </p>
          <dl className="grid grid-cols-2 gap-4 border-t border-ink-muted/25 pt-4 font-mono text-[11px] uppercase tracking-wider sm:grid-cols-4">
            <div>
              <dt className="text-ink-muted">Hands-on</dt>
              <dd className="mt-1 text-base tabular-nums text-ink-foreground">{plan.handsOnMin} min</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Made ahead</dt>
              <dd className="mt-1 text-base tabular-nums text-ink-foreground">
                {Math.round(plan.makeAheadShare * 100)}%
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Route items</dt>
              <dd className="mt-1 text-base tabular-nums text-ink-foreground">{plan.menu.length}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Hard stops</dt>
              <dd className="mt-1 text-base tabular-nums text-ink-foreground">{plan.stops.length}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export function StopsBlock({ plan }: { plan: Plan }) {
  if (plan.stops.length === 0) return null;
  return (
    <div className="border border-signal-over/40 bg-signal-over/[0.06]">
      <div className="border-b border-signal-over/25 px-6 py-3">
        <span className="rule-label text-signal-over">Hard stops · fail closed</span>
      </div>
      <ul className="divide-y divide-signal-over/20">
        {plan.stops.map((s) => (
          <li key={s.code} className="px-6 py-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-[11px] text-signal-over">{s.code}</span>
              <h4 className="text-base">{s.title}</h4>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
            <p className="mt-2 text-sm">
              <span className="rule-label">Correction</span>{" "}
              <span className="text-foreground">{s.correction}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
