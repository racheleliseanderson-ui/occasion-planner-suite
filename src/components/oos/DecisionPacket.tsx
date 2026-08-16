import { useMemo, useState } from "react";
import type { Dish, Plan } from "@/lib/oos/types";
import { buildDecision, decisionMarkdown } from "@/lib/oos/decision";
import { decisionPdf, styleForTheme } from "@/lib/oos/pdf";
import { useConfig } from "@/lib/oos/store";
import { download, slug } from "@/lib/oos/export";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";

const btn =
  "min-h-11 border border-border bg-card px-4 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

/**
 * The decision packet. Not a summary of the plan — a record of the judgement:
 * what binds it, what it assumes, what would change it, and what is being
 * accepted by going ahead. Every lever is a real re-run of the engine.
 */
export function DecisionPacket({ plan, library }: { plan: Plan; library: Dish[] }) {
  const { t } = useT();
  const { theme } = useTheme();
  const config = useConfig();
  const [busy, setBusy] = useState(false);
  const d = useMemo(() => buildDecision(plan, library), [plan, library]);

  return (
    <section aria-labelledby="oos-decision-heading" className="paper px-5 py-6 sm:px-7">
      <span className="rule-label">{t("dec.eyebrow")}</span>
      <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h2 id="oos-decision-heading" className="text-2xl tracking-tight">
            {t("dec.title")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("dec.body")}</p>
        </div>
        <div className="no-print flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            className={`${btn} border-foreground`}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await decisionPdf(d, styleForTheme(theme), config.printLayout);
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("dec.pdf")}
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => download(`${slug(d.label)}-decision.md`, "text/markdown", decisionMarkdown(d))}
          >
            {t("dec.md")}
          </button>
        </div>
      </div>

      {/* Verdict figure */}
      <div className="mt-6 grid gap-6 border-y border-foreground py-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <div className="min-w-0">
          <span className="figure-xl block tabular-nums leading-none">{d.feasibility}</span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            {d.verdict}
          </span>
        </div>
        <p className="min-w-0 text-base leading-relaxed sm:text-lg">{d.why}</p>
      </div>

      {d.binding && (
        <div className="mt-6">
          <span className="rule-label">{t("dec.binding")}</span>
          <p className="mt-2 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-2">
            <span className="text-lg">{d.binding.name}</span>
            <span className="font-mono text-sm tabular-nums">
              {d.binding.used}/{d.binding.capacity} {d.binding.unit} · {d.binding.pct > 400 ? "—" : `${d.binding.pct}%`}
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{d.binding.margin}</p>
        </div>
      )}

      {d.stops.length > 0 && (
        <div className="mt-8">
          <span className="rule-label">{t("dec.stops")}</span>
          <ul className="mt-3 space-y-3">
            {d.stops.map((s) => (
              <li key={s.code} className="border-l-2 border-signal-over pl-3">
                <p className="text-sm font-medium">
                  {s.code} — {s.title}
                </p>
                <p className="text-sm text-muted-foreground">{s.correction}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <span className="rule-label">{t("dec.assumptions")}</span>
          <dl className="mt-3 divide-y divide-border border-t border-border">
            {d.assumptions.map((a) => (
              <div key={a.label} className="flex flex-wrap justify-between gap-3 py-2">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{a.label}</dt>
                <dd className="text-sm">{a.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <span className="rule-label">{t("dec.levers")}</span>
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {d.levers.map((l) => (
              <li key={l.label} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{l.label}</span>
                  <span
                    className={
                      "font-mono text-xs tabular-nums " +
                      (l.delta > 0 ? "text-signal-controlled" : l.delta < 0 ? "text-signal-over" : "text-muted-foreground")
                    }
                  >
                    {l.feasibility}/100 · {l.delta >= 0 ? "+" : ""}
                    {l.delta} · {l.stops} stops
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{l.change}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <span className="rule-label">{t("dec.accepted")}</span>
        <ul className="mt-3 space-y-2">
          {d.accepted.map((a, i) => (
            <li key={i} className="border-l-2 border-accent pl-3 text-sm leading-relaxed">
              {a}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {t("dec.signature")} {d.signature}
      </p>
    </section>
  );
}
