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

  async function onFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    const out = readBulk(text, fixtureIds);
    if ("fatal" in out) {
      setResult(null);
      setFatal(out.fatal);
      return;
    }
    setFatal(null);
    setResult(out);
  }

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Import many dishes at once from a CSV sheet or a structured list file. Rows are validated one by one
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
          onClick={() => download("oos-bulk-template.csv", "text/csv", csvTemplate())}
          className="min-h-11 border border-border px-4 py-2 text-sm transition-colors hover:border-foreground"
        >
          Download CSV template
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json,text/csv,application/json"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {fatal ? (
        <p className="border border-border p-4 text-sm text-signal-over">{fatal}</p>
      ) : null}

      {result ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-sm">
            {result.valid.length} ready · {result.errors.length} refused
          </p>
          {result.errors.length > 0 ? (
            <ul className="max-h-40 overflow-auto text-xs text-muted-foreground">
              {result.errors.map((r) => (
                <li key={r.line}>
                  Row {r.line}: {r.error}
                </li>
              ))}
            </ul>
          ) : null}
          {result.valid.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                bulkApplyDishes(result.valid, fixtureIds);
                setResult(null);
              }}
              className="min-h-11 border border-foreground bg-foreground px-4 py-2 text-sm text-background"
            >
              Accept {result.valid.length} dishes
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Headers: {CSV_TEMPLATE_HEADERS.join(", ")}. Ingredients use item:perGuest:unit:aisle , separated by pipes.
        Minutes are per batch; cost is indicative per guest.
      </p>
    </div>
  );
}
