import { useRef, useState } from "react";
import { CSV_TEMPLATE_HEADERS, csvTemplate, readBulk, type BulkResult } from "@/lib/oos/bulk";
import { bulkApplyDishes } from "@/lib/oos/store";
import { download } from "@/lib/oos/export";

/**
 * Bulk library import. Every row is validated and shown as a diff before a
 * single dish is written; refusals name the row and the reason.
 */
export function BulkImport({ fixtureIds }: { fixtureIds: Set<string> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  function read(raw: string) {
    setApplied(null);
    const out = readBulk(raw, fixtureIds);
    if ("fatal" in out) {
      setFatal(out.fatal);
      setResult(null);
      return;
    }
    setFatal(null);
    setResult(out);
  }

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Import many dishes at once from a CSV sheet or a JSON array. Rows are validated one by one
        and nothing is written until you accept the diff. A row that fails is named and refused —
        it is never quietly repaired.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="min-h-11 border border-foreground bg-foreground px-4 py-2 text-sm text-background transition-opacity hover:opacity-85"
        >
          Choose file
        </button>
        <button
          type="button"
          onClick={() => download("oos-dish-template.csv", "text/csv", csvTemplate())}
          className="min-h-11 border border-border px-4 py-2 text-sm transition-colors hover:border-foreground"
        >
          Download CSV template
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json,text/csv,application/json"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (file.size > 4_000_000) {
              setFatal("That file is larger than 4 MB. Split it and import in passes.");
              return;
            }
            read(await file.text());
          }}
        />
      </div>

      <details className="border border-border bg-card">
        <summary className="cursor-pointer px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Expected columns
        </summary>
        <div className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <p className="font-mono break-words">{CSV_TEMPLATE_HEADERS.join(", ")}</p>
          <p className="mt-2">
            Lists use a pipe: <span className="font-mono">seated|buffet</span>. Ingredients use{" "}
            <span className="font-mono">item:perGuest:unit:aisle</span>, separated by pipes. Minutes
            are per batch; cost is indicative per guest.
          </p>
        </div>
      </details>

      {fatal && (
        <p className="border-l-2 border-signal-over bg-card px-4 py-3 text-sm text-signal-over">
          Import refused — {fatal}
        </p>
      )}

      {applied && (
        <p className="border-l-2 border-signal-controlled bg-card px-4 py-3 text-sm">{applied}</p>
      )}

      {result && (
        <div className="border border-border bg-card">
          <div className="grid gap-px bg-border sm:grid-cols-3">
            {[
              { label: "New dishes", value: result.added.length },
              { label: "Replacing existing", value: result.replaced.length },
              { label: "Refused rows", value: result.errors.length },
            ].map((s) => (
              <div key={s.label} className="bg-card px-4 py-3">
                <span className="rule-label">{s.label}</span>
                <p className="mt-1 font-mono text-2xl tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          {result.errors.length > 0 && (
            <div className="max-h-56 overflow-auto border-t border-border px-4 py-3">
              <span className="rule-label">Refusals</span>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {result.errors.slice(0, 60).map((r) => (
                  <li key={r.line}>
                    <span className="font-mono">Row {r.line}</span> — {r.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.valid.length > 0 && (
            <div className="max-h-56 overflow-auto border-t border-border px-4 py-3">
              <span className="rule-label">Will be written</span>
              <ul className="mt-2 space-y-1 text-xs">
                {result.valid.slice(0, 80).map((d) => (
                  <li key={d.id} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{d.name}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {fixtureIds.has(d.id) ? "replaces" : "new"} · {d.course}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
            <button
              type="button"
              disabled={result.valid.length === 0}
              onClick={() => {
                bulkApplyDishes(result.valid, fixtureIds);
                setApplied(
                  `${result.added.length} added, ${result.replaced.length} replaced. Every shipped fixture can still be reverted individually.`,
                );
                setResult(null);
              }}
              className="min-h-11 border border-foreground bg-foreground px-4 py-2 text-sm text-background transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              Apply {result.valid.length} dishes
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="min-h-11 border border-border px-4 py-2 text-sm transition-colors hover:border-foreground"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
