import { useState } from "react";
import type { Plan } from "@/lib/oos/types";
import { GaugeRow, StopsBlock, VerdictBlock } from "./Signals";
import { HandoffBar } from "./HandoffBar";
import { relief } from "@/lib/oos/explain";
import { cn } from "@/lib/utils";

const TABS = ["Route", "Load", "Shopping", "Prep clock", "Service"] as const;
type Tab = (typeof TABS)[number];

const WHEN_LABEL = { d2: "Two days out", d1: "Day before", dayof: "Day of" } as const;

export function PlanSurface({ plan }: { plan: Plan }) {
  const [tab, setTab] = useState<Tab>("Route");
  const [bought, setBought] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <VerdictBlock plan={plan} />
      <HandoffBar plan={plan} />
      <StopsBlock plan={plan} />

      <div className="paper grid gap-px bg-border sm:grid-cols-3">
        <div className="bg-card px-5 py-4">
          <span className="rule-label">Indicative cost</span>
          <p className="mt-1 font-mono text-xl tabular-nums">
            {plan.costPerHead.toFixed(2)}
            <span className="ml-1 text-xs text-muted-foreground">/ head</span>
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {plan.costTotal} total · ceiling {plan.costCeiling}
            {plan.costPerHead > plan.costCeiling ? " · over" : ""}
          </p>
        </div>
        <div className="bg-card px-5 py-4">
          <span className="rule-label">Menu balance</span>
          <p className="mt-1 font-mono text-xl tabular-nums">{plan.balance}</p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            method, temperature and timing spread
          </p>
        </div>
        <div className="bg-card px-5 py-4">
          <span className="rule-label">Made ahead</span>
          <p className="mt-1 font-mono text-xl tabular-nums">
            {Math.round(plan.makeAheadShare * 100)}%
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {plan.handsOnMin} hands-on minutes
          </p>
        </div>
      </div>

      {plan.balanceNotes.length > 0 && (
        <ul className="space-y-2">
          {plan.balanceNotes.map((n) => (
            <li key={n} className="border-l-2 border-signal-tight bg-card px-4 py-3 text-sm text-muted-foreground">
              {n}
            </li>
          ))}
        </ul>
      )}

      {plan.advisories.length > 0 && (
        <ul className="space-y-2">
          {plan.advisories.map((a) => (
            <li key={a} className="border-l-2 border-accent bg-card px-4 py-3 text-sm text-muted-foreground">
              {a}
            </li>
          ))}
        </ul>
      )}


      <div className="paper">
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border px-6 py-3">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
                tab === t
                  ? "text-foreground underline decoration-accent decoration-2 underline-offset-8"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-6 py-6">
          {tab === "Route" && (
            <ul className="divide-y divide-border">
              {plan.menu.map((m) => (
                <li key={m.dish.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="rule-label">{m.dish.course}</span>
                      <h4 className="text-lg">{m.dish.name}</h4>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{m.dish.note}</p>
                  </div>
                  <div className="text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:text-right">
                    <p className="text-foreground">{WHEN_LABEL[m.when]}</p>
                    <p className="mt-1">
                      {m.batches} batch{m.batches === 1 ? "" : "es"} · serves {m.serves}
                    </p>
                    <p className="mt-1">
                      {m.dish.ovenMin > 0 ? `${m.dish.ovenMin}m oven` : m.dish.burnerMin > 0 ? `${m.dish.burnerMin}m burner` : "no heat"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {tab === "Load" && (
            <div>
              {plan.gauges.map((g) => {
                const fix = relief(g, plan.conditions);
                return (
                  <div key={g.key}>
                    <GaugeRow g={g} />
                    {fix && (
                      <p className="mb-4 border-l-2 border-signal-tight pl-3 text-xs leading-relaxed text-muted-foreground">
                        <span className="rule-label">Relief</span> {fix}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "Shopping" && (
            <div className="space-y-6">
              {Object.entries(
                plan.shopping.reduce<Record<string, typeof plan.shopping>>((acc, line) => {
                  (acc[line.aisle] ||= []).push(line);
                  return acc;
                }, {}),
              ).map(([aisle, lines]) => (
                <div key={aisle}>
                  <span className="rule-label">{aisle}</span>
                  <ul className="mt-2 divide-y divide-border border-t border-border">
                    {lines.map((l) => (
                      <li key={l.item} className="flex flex-wrap items-baseline justify-between gap-3 py-2.5">
                        <span className="flex items-baseline gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={bought.includes(l.item)}
                            onChange={() =>
                              setBought((b) =>
                                b.includes(l.item) ? b.filter((x) => x !== l.item) : [...b, l.item],
                              )
                            }
                            aria-label={`Mark ${l.item} bought`}
                            className="accent-accent"
                          />
                          <span className={cn(bought.includes(l.item) && "line-through opacity-50")}>{l.item}</span>
                          <span className="ml-1 text-xs text-muted-foreground">{l.forDishes.join(" · ")}</span>
                        </span>
                        <span className="font-mono text-sm tabular-nums">
                          {l.qty} {l.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {bought.length} of {plan.shopping.length} lines marked bought
              </p>
              <p className="border-l-2 border-accent pl-3 text-xs text-muted-foreground">
                Quantities are fixture-derived planning estimates. No live prices, no substitutions,
                no guarantee against appetite. Check them against your own judgement before buying.
              </p>
            </div>
          )}

          {tab === "Prep clock" && (
            <ol className="relative border-l border-border pl-6">
              {plan.timeline.map((t, i) => (
                <li key={`${t.dish}-${t.task}-${i}`} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-accent" />
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-mono text-sm tabular-nums">{t.clock}</span>
                    <span className="rule-label">{t.phase}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {t.resource}
                    </span>
                    {t.owner && (
                      <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
                        {t.owner}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm">
                    <span className="font-medium">{t.dish}</span> — {t.task}
                  </p>
                  {t.minutes > 0 && (
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{t.minutes} min</p>
                  )}
                </li>
              ))}
            </ol>
          )}

          {tab === "Service" && (
            <ol className="divide-y divide-border">
              {plan.service.map((s, i) => (
                <li key={i} className="grid gap-1 py-3 sm:grid-cols-[6rem_1fr]">
                  <span className="font-mono text-sm tabular-nums">
                    {s.clock}
                    <span className="ml-2 text-[11px] text-muted-foreground">
                      {s.offsetMin >= 0 ? `+${s.offsetMin}` : s.offsetMin}
                    </span>
                  </span>
                  <div>
                    <p className="text-sm">{s.task}</p>
                    <p className="text-xs text-muted-foreground">{s.dish}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
