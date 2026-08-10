import type { ReactNode } from "react";
import { Explain } from "./Explain";
import { cn } from "@/lib/utils";

/** Shared form primitives for the conditions surfaces. Keyboard-first, tap-safe. */

export function Field({
  label,
  hint,
  explain,
  children,
}: {
  label: string;
  hint?: string;
  explain?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-border pt-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="rule-label">{label}</span>
          {explain ? <Explain text={explain} label={`What ${label} changes`} /> : null}
        </span>
        {hint ? <span className="font-mono text-[10px] text-muted-foreground">{hint}</span> : null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onSelect,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onSelect(o.value)}
          className={cn(
            "min-h-11 border px-3 py-1.5 text-sm transition-colors sm:min-h-0",
            value === o.value
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-card text-foreground hover:border-foreground/40",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  min,
  max,
  step = 1,
  suffix,
  onSet,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onSet: (v: number) => void;
  label?: string;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="inline-flex items-stretch border border-border bg-card">
      <button
        type="button"
        aria-label={`Decrease ${label ?? "value"}`}
        className="min-h-11 px-3 text-lg text-muted-foreground transition-colors hover:bg-muted"
        onClick={() => onSet(clamp(value - step))}
      >
        –
      </button>
      <span
        aria-live="polite"
        className="min-w-20 border-x border-border px-4 py-2 text-center font-mono text-sm tabular-nums"
      >
        {value}
        {suffix ? <span className="text-muted-foreground"> {suffix}</span> : null}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label ?? "value"}`}
        className="min-h-11 px-3 text-lg text-muted-foreground transition-colors hover:bg-muted"
        onClick={() => onSet(clamp(value + step))}
      >
        +
      </button>
    </div>
  );
}

export function Toggle({
  on,
  onToggle,
  children,
}: {
  on: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        "min-h-11 border px-3 py-1.5 text-sm transition-colors sm:min-h-0",
        on
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card hover:border-foreground/40",
      )}
    >
      {children}
    </button>
  );
}
