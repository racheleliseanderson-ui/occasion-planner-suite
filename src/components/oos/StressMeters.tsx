import { dimensionLabel, scoreBand } from "@/lib/architecture/labels";
import type { MenuStressTest } from "@/lib/architecture/types";
import { cn } from "@/lib/utils";

export function StressMeters({ stress }: { stress: MenuStressTest }) {
  const ordered = Object.entries(stress.dimensions || {}).sort((a, b) => a[1] - b[1]);
  const weak = (stress.weakDimensions || []).slice().sort((a, b) => a.score - b.score);
  const band = scoreBand(stress.score);

  return (
    <section className="border border-border bg-card p-5 sm:p-6" aria-labelledby="stress-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="rule-label">Operational stress test</span>
          <h3 id="stress-title" className="mt-1 font-display text-2xl tracking-tight">
            Menu load: {stress.score}{" "}
            <span className="text-muted-foreground">· {band}</span>
          </h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Five axes · weakest first
          </p>
        </div>
        <span
          className={cn(
            "font-mono text-[11px] uppercase tracking-widest",
            band === "strong" && "text-signal-controlled",
            band === "workable" && "text-signal-tight",
            band === "fragile" && "text-signal-over",
          )}
        >
          {band}
        </span>
      </div>

      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{stress.verdict}</p>

      {weak.length ? (
        <p className="mt-3 border border-signal-over/40 bg-card px-3 py-2 text-sm text-signal-over">
          <strong>Fix first:</strong>{" "}
          {weak.map((w) => `${dimensionLabel(w.dimension)} (${w.score})`).join(" · ")}
        </p>
      ) : (
        <p className="mt-3 text-sm text-signal-controlled">No dimension is currently fragile.</p>
      )}

      <div
        className="mt-5 space-y-3"
        role="group"
        aria-label="Stress test dimensions, weakest first"
      >
        {ordered.map(([key, value]) => {
          const b = scoreBand(value);
          return (
            <div
              key={key}
              className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2 sm:grid-cols-[9rem_1fr_2.75rem]"
            >
              <span className="text-sm">{dimensionLabel(key)}</span>
              <div
                className="h-2 overflow-hidden bg-muted"
                role="meter"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${dimensionLabel(key)} ${value} of 100`}
              >
                <div
                  className={cn(
                    "h-full",
                    b === "strong" && "bg-signal-controlled",
                    b === "workable" && "bg-brass",
                    b === "fragile" && "bg-signal-over",
                  )}
                  style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
                />
              </div>
              <span className="text-right font-mono text-sm tabular-nums">{value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
