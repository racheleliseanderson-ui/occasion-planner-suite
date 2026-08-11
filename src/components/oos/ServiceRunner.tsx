import { useEffect, useMemo, useState } from "react";
import type { Plan } from "@/lib/oos/types";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Mark = "done" | "late" | "skip";

const btn =
  "min-h-11 border border-border bg-card px-4 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

/** Minutes past midnight from a HH:MM clock; null when unparsable. */
function minutesOf(clock: string): number | null {
  const m = /(\d{1,2}):(\d{2})/.exec(clock);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * The day-of service runner: a live clock against the committed schedule.
 * It states the drift honestly — the plan is not re-written to flatter the
 * host, it simply reports how far behind or ahead the room actually is.
 */
export function ServiceRunner({ plan }: { plan: Plan }) {
  const { t } = useT();
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [marks, setMarks] = useState<Record<number, Mark>>({});

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, [running]);

  const tasks = useMemo(
    () => plan.timeline.filter((x) => x.phase === "Day of").concat(plan.service.map((s) => ({ ...s, phase: "Service", minutes: 0, dish: s.dish }) as never)),
    [plan],
  );

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const open = tasks.map((task, i) => ({ task, i })).filter(({ i }) => !marks[i]);
  const next = open[0];
  const nextMin = next ? minutesOf(next.task.clock) : null;
  const drift = running && nextMin !== null ? nowMin - nextMin : null;
  const remaining = open.length;
  const total = tasks.length;

  const mark = (i: number, m: Mark) => setMarks((p) => ({ ...p, [i]: p[i] === m ? (undefined as never) : m }));

  return (
    <section aria-labelledby="oos-service-heading" className="no-print paper px-5 py-6 sm:px-7">
      <span className="rule-label">{t("svc.eyebrow")}</span>
      <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h2 id="oos-service-heading" className="text-2xl tracking-tight">
            {t("svc.title")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("svc.body")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            className={cn(btn, running ? "" : "border-foreground bg-foreground text-background")}
            onClick={() => {
              setNow(new Date());
              setRunning((r) => !r);
            }}
          >
            {running ? t("svc.stop") : t("svc.start")}
          </button>
          <button type="button" className={btn} onClick={() => setMarks({})}>
            {t("svc.reset")}
          </button>
        </div>
      </div>

      {/* Live board */}
      <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-3">
        <div className="bg-card px-4 py-4">
          <span className="rule-label">{t("svc.next")}</span>
          {next ? (
            <>
              <p className="mt-2 font-mono text-2xl tabular-nums">{next.task.clock}</p>
              <p className="mt-1 text-sm">
                <span className="font-medium">{next.task.dish}</span> — {next.task.task}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t("svc.complete")}</p>
          )}
        </div>
        <div className="bg-card px-4 py-4">
          <span className="rule-label">{drift !== null && drift > 0 ? t("svc.behind") : t("svc.slack")}</span>
          <p
            className={cn(
              "mt-2 font-mono text-2xl tabular-nums",
              drift !== null && drift > 10 ? "text-signal-over" : drift !== null && drift > 0 ? "text-accent" : "",
            )}
          >
            {drift === null ? "—" : `${drift > 0 ? "+" : ""}${drift} min`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {running ? `${t("svc.elapsed")} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : t("svc.notStarted")}
          </p>
        </div>
        <div className="bg-card px-4 py-4">
          <span className="rule-label">{t("svc.board")}</span>
          <p className="mt-2 font-mono text-2xl tabular-nums">
            {total - remaining}/{total}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {remaining} {t("svc.remaining")}
          </p>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {tasks.map((task, i) => {
          const m = marks[i];
          const min = minutesOf(task.clock);
          const due = running && min !== null && !m && min <= nowMin;
          return (
            <li
              key={`${task.clock}-${i}`}
              className={cn(
                "grid gap-2 py-3 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center",
                m === "skip" && "opacity-50",
                due && "border-l-2 border-signal-over pl-3",
              )}
            >
              <span className="font-mono text-xs tabular-nums">{task.clock}</span>
              <span className={cn("min-w-0 text-sm", m === "done" && "line-through decoration-1")}>
                <span className="font-medium">{task.dish}</span> — {task.task}
                {task.minutes > 0 ? <span className="text-muted-foreground"> ({task.minutes} min)</span> : null}
              </span>
              <span className="flex shrink-0 gap-1">
                {(["done", "late", "skip"] as Mark[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={m === k}
                    onClick={() => mark(i, k)}
                    className={cn(
                      "min-h-11 border border-border px-3 font-mono text-[10px] uppercase tracking-widest transition-colors",
                      m === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t(k === "done" ? "svc.done" : k === "late" ? "svc.late" : "svc.skip")}
                  </button>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
