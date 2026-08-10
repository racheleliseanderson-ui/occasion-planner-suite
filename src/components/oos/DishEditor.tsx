import { useState } from "react";
import type { Aisle, Contains, Course, Dish, OccasionShape, Season, ServiceStyle } from "@/lib/oos/types";
import { cn } from "@/lib/utils";

const COURSES: Course[] = ["board", "starter", "anchor", "side", "bread", "sweet", "drink"];
const CONTAINS: Contains[] = ["meat", "pork", "fish", "shellfish", "dairy", "gluten", "nut", "egg", "alcohol"];
const STYLES: ServiceStyle[] = ["seated", "buffet", "grazing", "cocktail"];
const SHAPES: OccasionShape[] = ["dinner", "brunch", "reception", "cookout", "aperitivo"];
const SEASONS: Season[] = ["spring", "summer", "autumn", "winter", "year-round"];
const AISLES: Aisle[] = ["produce", "protein", "dairy", "pantry", "bakery", "frozen", "drinks", "non-food"];
const METHODS: NonNullable<Dish["method"]>[] = ["roast", "braise", "fry", "boil", "grill", "raw", "bake", "chill"];
const TEMPS: NonNullable<Dish["tempBand"]>[] = ["cold", "ambient", "warm", "hot"];

const input = "w-full border border-border bg-card px-2.5 py-2 text-sm";
const num = "w-full border border-border bg-card px-2.5 py-2 font-mono text-sm tabular-nums";

function Chips<T extends string>({
  options,
  values,
  onToggle,
}: {
  options: readonly T[];
  values: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onToggle(o)}
          className={cn(
            "border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
            values.includes(o)
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-card text-muted-foreground hover:border-foreground/40",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="rule-label">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function DishEditor({
  dish,
  isFixture,
  onSave,
  onCancel,
}: {
  dish: Dish;
  isFixture: boolean;
  onSave: (d: Dish) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Dish>(dish);
  const set = (patch: Partial<Dish>) => setD((prev) => ({ ...prev, ...patch }));
  const toggle = <T extends string>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <div className="paper">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <span className="rule-label">{isFixture ? "Editing fixture" : "Editing your dish"}</span>
          <h3 className="mt-1 text-xl tracking-tight">{d.name || "Untitled dish"}</h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{d.id}</span>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Name">
            <input className={input} value={d.name} maxLength={80} onChange={(e) => set({ name: e.target.value })} />
          </Row>
          <Row label="Course">
            <select className={input} value={d.course} onChange={(e) => set({ course: e.target.value as Course })}>
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Row>
        </div>

        <Row label="Note">
          <input className={input} value={d.note} maxLength={240} onChange={(e) => set({ note: e.target.value })} />
        </Row>

        <div className="grid gap-4 sm:grid-cols-4">
          <Row label="Oven min">
            <input type="number" min={0} max={600} className={num} value={d.ovenMin} onChange={(e) => set({ ovenMin: Number(e.target.value) })} />
          </Row>
          <Row label="Burner min">
            <input type="number" min={0} max={600} className={num} value={d.burnerMin} onChange={(e) => set({ burnerMin: Number(e.target.value) })} />
          </Row>
          <Row label="Active min">
            <input type="number" min={0} max={300} className={num} value={d.activeMin} onChange={(e) => set({ activeMin: Number(e.target.value) })} />
          </Row>
          <Row label="Hold min">
            <input type="number" min={0} max={600} className={num} value={d.holdMin} onChange={(e) => set({ holdMin: Number(e.target.value) })} />
          </Row>
          <Row label="Serves / batch">
            <input type="number" min={1} max={60} className={num} value={d.servesPerBatch} onChange={(e) => set({ servesPerBatch: Number(e.target.value) })} />
          </Row>
          <Row label="Fridge units">
            <input type="number" min={0} max={12} className={num} value={d.fridgeUnits} onChange={(e) => set({ fridgeUnits: Number(e.target.value) })} />
          </Row>
          <Row label="Counter 0–3">
            <input type="number" min={0} max={3} className={num} value={d.counter} onChange={(e) => set({ counter: Number(e.target.value) })} />
          </Row>
          <Row label="Cost / guest">
            <input type="number" min={0} max={200} step={0.1} className={num} value={d.costPerGuest ?? 0} onChange={(e) => set({ costPerGuest: Number(e.target.value) })} />
          </Row>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Row label="Make-ahead days">
            <select className={input} value={d.makeAheadDays} onChange={(e) => set({ makeAheadDays: Number(e.target.value) as 0 | 1 | 2 })}>
              <option value={0}>0 — day of only</option>
              <option value={1}>1 — day before</option>
              <option value={2}>2 — two days out</option>
            </select>
          </Row>
          <Row label="Method">
            <select className={input} value={d.method ?? "raw"} onChange={(e) => set({ method: e.target.value as NonNullable<Dish["method"]> })}>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Temperature band">
            <select className={input} value={d.tempBand ?? "hot"} onChange={(e) => set({ tempBand: e.target.value as NonNullable<Dish["tempBand"]> })}>
              {TEMPS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Row>
        </div>

        <Row label="Contains — planning filters, not allergen certification">
          <Chips options={CONTAINS} values={d.contains} onToggle={(v) => set({ contains: toggle(d.contains, v) })} />
        </Row>
        <Row label="Service formats">
          <Chips options={STYLES} values={d.formats} onToggle={(v) => set({ formats: toggle(d.formats, v) })} />
        </Row>
        <Row label="Occasion shapes">
          <Chips options={SHAPES} values={d.shapes} onToggle={(v) => set({ shapes: toggle(d.shapes, v) })} />
        </Row>
        <Row label="Seasons">
          <Chips options={SEASONS} values={d.season ?? []} onToggle={(v) => set({ season: toggle(d.season ?? [], v) })} />
        </Row>

        <div className="flex flex-wrap gap-1.5">
          {([
            ["grill", "Needs a grill", d.grill],
            ["kidFriendly", "Reliably eaten by children", d.kidFriendly],
            ["outdoorSafe", "Holds up outdoors", d.outdoorSafe],
          ] as const).map(([key, label, on]) => (
            <button
              key={key}
              type="button"
              onClick={() => set({ [key]: !on } as Partial<Dish>)}
              className={cn(
                "border px-3 py-1.5 text-sm transition-colors",
                on ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-foreground/40",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="rule-label">Ingredients — per guest</span>
            <button
              type="button"
              onClick={() =>
                set({ ingredients: [...d.ingredients, { item: "", perGuest: 0.1, unit: "g", aisle: "pantry" }] })
              }
              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Add line
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {d.ingredients.map((ing, i) => (
              <li key={i} className="grid gap-2 sm:grid-cols-[1fr_5rem_5rem_8rem_auto]">
                <input
                  className={input}
                  placeholder="Item"
                  value={ing.item}
                  onChange={(e) => {
                    const next = [...d.ingredients];
                    next[i] = { ...ing, item: e.target.value };
                    set({ ingredients: next });
                  }}
                />
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  className={num}
                  value={ing.perGuest}
                  onChange={(e) => {
                    const next = [...d.ingredients];
                    next[i] = { ...ing, perGuest: Number(e.target.value) };
                    set({ ingredients: next });
                  }}
                />
                <input
                  className={input}
                  placeholder="unit"
                  value={ing.unit}
                  onChange={(e) => {
                    const next = [...d.ingredients];
                    next[i] = { ...ing, unit: e.target.value };
                    set({ ingredients: next });
                  }}
                />
                <select
                  className={input}
                  value={ing.aisle}
                  onChange={(e) => {
                    const next = [...d.ingredients];
                    next[i] = { ...ing, aisle: e.target.value as Aisle };
                    set({ ingredients: next });
                  }}
                >
                  {AISLES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => set({ ingredients: d.ingredients.filter((_, x) => x !== i) })}
                  className="border border-border px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-signal-over hover:text-signal-over"
                >
                  Remove
                </button>
              </li>
            ))}
            {d.ingredients.length === 0 && (
              <li className="text-xs text-muted-foreground">
                No ingredient lines. This dish will not appear on the shopping list.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border px-6 py-4">
        <button
          type="button"
          onClick={() => onSave({ ...d, name: d.name.trim() || "Untitled dish" })}
          className="bg-foreground px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90"
        >
          Save to my library
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
