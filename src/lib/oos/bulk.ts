import { dishSchema } from "./store";
import type { Dish } from "./types";

/**
 * Bulk library import. Accepts a JSON array of dishes or a CSV sheet, validates
 * every row, and returns a diff the host approves before anything is written.
 * Nothing is applied silently and nothing is guessed: a malformed row is
 * reported by line and reason, never repaired.
 */

export interface BulkRow {
  line: number;
  dish?: Dish;
  error?: string;
}

export interface BulkResult {
  rows: BulkRow[];
  valid: Dish[];
  errors: BulkRow[];
  added: Dish[];
  replaced: Dish[];
}

const LIST_FIELDS = ["contains", "formats", "shapes", "season"] as const;
const NUM_FIELDS = [
  "ovenMin",
  "burnerMin",
  "fridgeUnits",
  "counter",
  "activeMin",
  "servesPerBatch",
  "makeAheadDays",
  "holdMin",
  "costPerGuest",
] as const;
const BOOL_FIELDS = ["grill", "kidFriendly", "outdoorSafe"] as const;

/** The header row a host should start from. */
export const CSV_TEMPLATE_HEADERS = [
  "id",
  "name",
  "course",
  "note",
  "contains",
  "formats",
  "shapes",
  "season",
  "ovenMin",
  "burnerMin",
  "grill",
  "fridgeUnits",
  "counter",
  "activeMin",
  "servesPerBatch",
  "makeAheadDays",
  "holdMin",
  "costPerGuest",
  "method",
  "tempBand",
  "kidFriendly",
  "outdoorSafe",
  "ingredients",
];

export function csvTemplate(): string {
  return [
    CSV_TEMPLATE_HEADERS.join(","),
    [
      "my-braise",
      "Sunday braise",
      "anchor",
      "Cooks unattended and improves overnight.",
      "meat|dairy",
      "seated|buffet",
      "dinner",
      "autumn|winter",
      "180",
      "20",
      "false",
      "2",
      "1",
      "35",
      "8",
      "2",
      "90",
      "6.5",
      "braise",
      "hot",
      "true",
      "false",
      "beef shin:0.22:kg:protein|onion:0.5:each:produce",
    ].join(","),
  ].join("\n");
}

/** Minimal RFC-4180 reader: quoted fields, escaped quotes, no streaming. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function parseIngredients(raw: string) {
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [item = "", perGuest = "0", unit = "each", aisle = "pantry"] = s.split(":");
      return { item: item.trim(), perGuest: Number(perGuest), unit: unit.trim(), aisle: aisle.trim() };
    });
}

function rowToRecord(headers: string[], cells: string[]): Record<string, unknown> {
  const rec: Record<string, unknown> = {};
  headers.forEach((h, i) => {
    const key = h.trim();
    const raw = (cells[i] ?? "").trim();
    if (!key) return;
    if (key === "ingredients") rec[key] = parseIngredients(raw);
    else if ((LIST_FIELDS as readonly string[]).includes(key))
      rec[key] = raw ? raw.split("|").map((s) => s.trim()).filter(Boolean) : [];
    else if ((NUM_FIELDS as readonly string[]).includes(key)) {
      if (raw !== "") rec[key] = Number(raw);
    } else if ((BOOL_FIELDS as readonly string[]).includes(key)) {
      if (raw !== "") rec[key] = raw.toLowerCase() === "true" || raw === "1" || raw.toLowerCase() === "yes";
    } else if (raw !== "") rec[key] = raw;
    else if (key === "note") rec[key] = "";
  });
  return rec;
}

function validate(rec: unknown, line: number): BulkRow {
  const parsed = dishSchema.safeParse(rec);
  if (parsed.success) return { line, dish: parsed.data as Dish };
  const issue = parsed.error.issues[0];
  return {
    line,
    error: issue ? `${issue.path.join(".") || "row"}: ${issue.message}` : "Row rejected",
  };
}

/**
 * Read a pasted or uploaded payload. `existingIds` decides which valid rows are
 * additions and which replace a dish already in the library.
 */
export function readBulk(raw: string, existingIds: Set<string>): BulkResult | { fatal: string } {
  const text = raw.trim();
  if (!text) return { fatal: "The file is empty." };

  let rows: BulkRow[];
  if (text.startsWith("[") || text.startsWith("{")) {
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return { fatal: "That file is not readable JSON." };
    }
    const list = Array.isArray(json)
      ? json
      : Array.isArray((json as { dishes?: unknown }).dishes)
        ? (json as { dishes: unknown[] }).dishes
        : null;
    if (!list) return { fatal: "Expected an array of dishes, or an object with a `dishes` array." };
    rows = list.map((r, i) => validate(r, i + 1));
  } else {
    const grid = parseCsv(text);
    const headers = grid[0];
    if (!headers) return { fatal: "No header row found." };
    if (!headers.some((h) => h.trim() === "id") || !headers.some((h) => h.trim() === "name"))
      return { fatal: "The header row must include at least `id` and `name`." };
    rows = grid.slice(1).map((cells, i) => validate(rowToRecord(headers, cells), i + 2));
  }

  if (rows.length > 500) return { fatal: "That file holds more than 500 rows. Split it and import in passes." };

  const seen = new Set<string>();
  rows.forEach((r) => {
    if (!r.dish) return;
    if (seen.has(r.dish.id)) {
      r.error = `Duplicate id \`${r.dish.id}\` inside this file`;
      delete r.dish;
    } else seen.add(r.dish.id);
  });

  const valid = rows.flatMap((r) => (r.dish ? [r.dish] : []));
  return {
    rows,
    valid,
    errors: rows.filter((r) => r.error),
    added: valid.filter((d) => !existingIds.has(d.id)),
    replaced: valid.filter((d) => existingIds.has(d.id)),
  };
}
