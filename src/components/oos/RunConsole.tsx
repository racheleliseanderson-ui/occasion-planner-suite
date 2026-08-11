import { useCallback, useEffect, useRef, useState } from "react";
import type { Conditions, Dish, Plan } from "@/lib/oos/types";
import { STAGES, executeStage, runRecord, type StageId, type StageReport } from "@/lib/oos/run";
import { diffConditions } from "@/lib/oos/diff";
import { recordRun, clearRunHistory, useConfig } from "@/lib/oos/store";
import { useT, type Key } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STAGE_KEY: Record<StageId, Key> = {
  menu: "run.stage.menu",
  load: "run.stage.load",
  schedule: "run.stage.schedule",
  cost: "run.stage.cost",
};

const btn =
  "min-h-11 border border-border bg-card px-4 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

interface Props {
  conditions: Conditions;
  library: Dish[];
  /** called with the committed plan when a run completes */
  onCommit: (plan: Plan) => void;
  /** called when the host restores a past run's conditions */
  onRestore: (c: Conditions) => void;
  /** true when the conditions have moved since the last committed run */
  stale: boolean;
  committed: boolean;
}

/**
 * The run console. Four stages, each executing the real engine and reporting
 * its own output, with run / step / pause / re-run control and a local history
 * of completed runs that can be compared and restored.
 */
export function RunConsole({ conditions, library, onCommit, onRestore, stale, committed }: Props) {
  const { t } = useT();
  const config = useConfig();
  const [reports, setReports] = useState<Partial<Record<StageId, StageReport>>>({});
  const [index, setIndex] = useState(0); // next stage to execute
  const [auto, setAuto] = useState(false);
  const [compare, setCompare] = useState<string | null>(null);
  const planRef = useRef<Plan | null>(null);

  const runOne = useCallback(() => {
    const id = STAGES[index];
    if (!id) return;
    const { report, plan } = executeStage(id, conditions, library);
    planRef.current = plan;
    setReports((r) => ({ ...r, [id]: report }));
    setIndex((i) => i + 1);
    if (index === STAGES.length - 1) {
      setAuto(false);
      onCommit(plan);
      recordRun(runRecord(plan) as never);
    }
  }, [conditions, index, library, onCommit]);

  // Automatic mode advances one stage per frame-ish tick so each stage is visible.
  useEffect(() => {
    if (!auto || index >= STAGES.length) return;
    const id = window.setTimeout(runOne, 140);
    return () => window.clearTimeout(id);
  }, [auto, index, runOne]);

  const reset = () => {
    setReports({});
    setIndex(0);
    planRef.current = null;
  };

  const start = () => {
    reset();
    setAuto(true);
  };

  const running = auto && index < STAGES.length;
  const finished = index >= STAGES.length;
  const current = STAGES[index];

  const compared = config.runHistory.find((r) => r.id === compare);
  const diff = compared ? diffConditions(conditions, compared.conditions as unknown as Conditions) : [];

  return (
    <section aria-labelledby="oos-run-heading" className="no-print paper px-5 py-6 sm:px-7">
      <span className="rule-label">{t("run.eyebrow")}</span>
      <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h2 id="oos-run-heading" className="text-2xl tracking-tight">
            {t("run.title")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("run.body")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className={cn(btn, "border-foreground bg-foreground text-background")} onClick={start}>
            {finished ? t("run.rerun") : t("run.start")}
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => {
              setAuto(false);
              if (finished) reset();
              else runOne();
            }}
          >
            {t("run.step")}
          </button>
          <button type="button" className={btn} onClick={() => setAuto((a) => !a)} disabled={finished}>
            {running ? t("run.pause") : t("run.resume")}
          </button>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {running && current ? `${t(STAGE_KEY[current])} — ${t("run.status.running")}` : finished ? t("run.committed") : ""}
      </p>

      {/* Stage strip */}
      <ol className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-4">
        {STAGES.map((id, i) => {
          const r = reports[id];
          const state = r ? "done" : i === index && running ? "running" : "idle";
          return (
            <li key={id} className="bg-card px-4 py-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="rule-label">{`0${i + 1}`}</span>
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-widest",
                    state === "done" ? "text-signal-controlled" : state === "running" ? "text-accent" : "text-muted-foreground",
                  )}
                >
                  {state === "done" ? t("run.status.done") : state === "running" ? t("run.status.running") : t("run.status.idle")}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium">{t(STAGE_KEY[id])}</p>
              <p className="mt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
                {r ? `${r.ms} ms` : t("run.pending")}
              </p>
              {r && <p className="mt-2 text-xs leading-relaxed">{r.headline}</p>}
              {r && r.notes.length > 0 && (
                <ul className="mt-2 space-y-1 border-l border-border pl-2">
                  {r.notes.slice(0, 6).map((n, j) => (
                    <li key={j} className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                      {n}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-xs text-muted-foreground">
        {finished || committed ? (stale ? t("run.stale") : t("run.committed")) : ""}
      </p>

      {/* History */}
      <div className="mt-8 marquee">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="rule-label">{t("run.history")}</span>
          {config.runHistory.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearRunHistory();
                setCompare(null);
              }}
              className="min-h-11 font-mono text-[10px] uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("run.clearHistory")}
            </button>
          )}
        </div>
        {config.runHistory.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">{t("run.history.empty")}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <caption className="sr-only">{t("run.history")}</caption>
              <thead>
                <tr className="border-b border-foreground">
                  <th scope="col" className="rule-label py-2 text-left">
                    {t("run.title")}
                  </th>
                  <th scope="col" className="rule-label px-3 py-2 text-right">
                    {t("tbl.feasibility")}
                  </th>
                  <th scope="col" className="rule-label px-3 py-2 text-right">
                    {t("tbl.stops")}
                  </th>
                  <th scope="col" className="rule-label py-2 text-left">
                    {t("dec.binding")}
                  </th>
                  <th scope="col" className="rule-label py-2 text-right" />
                </tr>
              </thead>
              <tbody>
                {config.runHistory.map((r) => (
                  <tr key={r.id} className="border-b border-border align-top">
                    <td className="py-3">
                      <span className="block">{r.label}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {r.signature} · {new Date(r.at).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums">{r.feasibility}</td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums">{r.stops}</td>
                    <td className="py-3 font-mono text-[11px] text-muted-foreground">{r.binding}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="min-h-11 px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                          onClick={() => setCompare(compare === r.id ? null : r.id)}
                          aria-pressed={compare === r.id}
                        >
                          {t("run.compare")}
                        </button>
                        <button
                          type="button"
                          className="min-h-11 px-2 font-mono text-[10px] uppercase tracking-widest underline-offset-4 hover:underline"
                          onClick={() => onRestore(r.conditions as unknown as Conditions)}
                        >
                          {t("run.restore")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {compared && (
          <div className="mt-4 border-l-2 border-accent pl-3">
            <span className="rule-label">{t("run.against")}</span>
            {diff.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">{t("run.noDiff")}</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {diff.map((d) => (
                  <li key={d.field} className="font-mono text-[11px]">
                    <span className="text-muted-foreground">{d.field}: </span>
                    {d.to} → {d.from}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
