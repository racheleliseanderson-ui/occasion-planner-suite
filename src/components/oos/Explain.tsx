import { useState } from "react";

/** Inline "why does this matter" disclosure. Keyboard reachable, no library. */
export function Explain({ text, label = "Explain this input" }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="flex h-4 w-4 items-center justify-center border border-border font-mono text-[9px] leading-none text-muted-foreground transition-colors hover:border-accent hover:text-accent"
      >
        ?
      </button>
      {open && (
        <span
          role="note"
          className="absolute left-0 top-6 z-30 w-64 border border-border bg-popover px-3 py-2.5 text-[11px] leading-relaxed text-popover-foreground shadow-lg sm:w-80"
        >
          {text}
        </span>
      )}
    </span>
  );
}
