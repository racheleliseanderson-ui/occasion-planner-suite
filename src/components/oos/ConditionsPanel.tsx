import type { Conditions, DietFilter, OccasionShape, ServiceStyle } from "@/lib/oos/types";
import { BUDGET_CEILING, DIET_LABELS } from "@/lib/oos/engine";
import { EXPLAIN } from "@/lib/oos/explain";
import { useConfig } from "@/lib/oos/store";
import { Explain } from "./Explain";
import { OpsPanel } from "./OpsPanel";
import { cn } from "@/lib/utils";

interface Props {
  value: Conditions;
  onChange: (next: Conditions) => void;
}

function Field({
  label,
  hint,
  explain,
  children,
}: {
  label: string;
  hint?: string;
  explain?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className="rule-label">{label}</span>
          {explain ? <Explain text={explain} label={`What ${label} changes`} /> : null}
        </span>
        {hint ? <span className="font-mono text-[10px] text-muted-foreground">{hint}</span> : null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onSelect,
}: {
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onSelect(o.value)}
          className={cn(
            "border px-3 py-1.5 text-sm transition-colors",
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

function Stepper({
  value,
  min,
  max,
  step = 1,
  suffix,
  onSet,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onSet: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="inline-flex items-stretch border border-border bg-card">
      <button
        type="button"
        aria-label="decrease"
        className="px-3 text-lg text-muted-foreground transition-colors hover:bg-muted"
        onClick={() => onSet(clamp(value - step))}
      >
        –
      </button>
      <span className="min-w-20 border-x border-border px-4 py-2 text-center font-mono text-sm tabular-nums">
        {value}
        {suffix ? <span className="text-muted-foreground"> {suffix}</span> : null}
      </span>
      <button
        type="button"
        aria-label="increase"
        className="px-3 text-lg text-muted-foreground transition-colors hover:bg-muted"
        onClick={() => onSet(clamp(value + step))}
      >
        +
      </button>
    </div>
  );
}

const DIETS: DietFilter[] = [
  "no-meat",
  "no-animal",
  "no-gluten",
  "no-dairy",
  "no-nut",
  "no-shellfish",
  "no-pork",
  "no-alcohol",
];

export function ConditionsPanel({ value, onChange }: Props) {
  const config = useConfig();
  const set = (patch: Partial<Conditions>) => onChange({ ...value, ...patch });
  const setKitchen = (patch: Partial<Conditions["kitchen"]>) =>
    onChange({ ...value, kitchen: { ...value.kitchen, ...patch } });

  return (
    <div className="paper grain">
      <div className="border-b border-border px-6 py-5">
        <span className="rule-label">Section 01</span>
        <h2 className="mt-1 text-2xl tracking-tight">Operating conditions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Declare what is true. The engine will not assume equipment, seats, or time you have not
          stated.
        </p>
      </div>

      <div className="space-y-5 px-6 py-5">
        <Field label="Occasion shape" explain={EXPLAIN.shape}>
          <Segmented<OccasionShape>
            value={value.shape}
            onSelect={(shape) => set({ shape })}
            options={[
              { value: "dinner", label: "Dinner" },
              { value: "brunch", label: "Brunch" },
              { value: "reception", label: "Reception" },
              { value: "cookout", label: "Cookout" },
              { value: "aperitivo", label: "Aperitivo" },
            ]}
          />
        </Field>

        <Field label="Service style" hint="drives portioning and choreography" explain={EXPLAIN.style}>
          <Segmented<ServiceStyle>
            value={value.style}
            onSelect={(style) => set({ style })}
            options={[
              { value: "seated", label: "Seated" },
              { value: "buffet", label: "Buffet" },
              { value: "grazing", label: "Grazing" },
              { value: "cocktail", label: "Standing" },
            ]}
          />
        </Field>

        <Field label="Guests" hint="counted, not estimated" explain={EXPLAIN.guests}>
          <div className="flex flex-wrap items-center gap-3">
            <Stepper value={value.guests} min={2} max={40} onSet={(guests) => set({ guests })} />
            <span className="text-sm text-muted-foreground">
              {value.style === "seated" ? `against ${value.kitchen.seats} declared seats` : "self-service allowance applied"}
            </span>
          </div>
        </Field>

        <Field label="Seats at the real table" explain={EXPLAIN.seats}>
          <Stepper value={value.kitchen.seats} min={0} max={40} onSet={(seats) => setKitchen({ seats })} />
        </Field>

        <Field label="Service time & day-of window" explain={EXPLAIN.time}>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="time"
              value={value.serviceTime}
              onChange={(e) => set({ serviceTime: e.target.value })}
              className="border border-border bg-card px-3 py-2 font-mono text-sm"
            />
            <Stepper
              value={value.prepWindowH}
              min={1}
              max={12}
              suffix="h free"
              onSet={(prepWindowH) => set({ prepWindowH })}
            />
          </div>
        </Field>

        <Field label="Kitchen reality" hint="fail-closed inputs" explain={EXPLAIN.kitchen}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Ovens</p>
              <Segmented<number>
                value={value.kitchen.ovens}
                onSelect={(ovens) => setKitchen({ ovens })}
                options={[
                  { value: 0, label: "None" },
                  { value: 1, label: "One" },
                  { value: 2, label: "Two" },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Usable burners</p>
              <Segmented<number>
                value={value.kitchen.burners}
                onSelect={(burners) => setKitchen({ burners })}
                options={[
                  { value: 0, label: "0" },
                  { value: 2, label: "2" },
                  { value: 4, label: "4" },
                  { value: 6, label: "6" },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Cold storage</p>
              <Segmented<Conditions["kitchen"]["fridge"]>
                value={value.kitchen.fridge}
                onSelect={(fridge) => setKitchen({ fridge })}
                options={[
                  { value: "tight", label: "Tight" },
                  { value: "normal", label: "Normal" },
                  { value: "roomy", label: "Roomy" },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Counter & landing space</p>
              <Segmented<Conditions["kitchen"]["counter"]>
                value={value.kitchen.counter}
                onSelect={(counter) => setKitchen({ counter })}
                options={[
                  { value: "small", label: "Small" },
                  { value: "medium", label: "Medium" },
                  { value: "large", label: "Large" },
                ]}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setKitchen({ dishwasher: !value.kitchen.dishwasher })}
              className={cn(
                "border px-3 py-1.5 text-sm transition-colors",
                value.kitchen.dishwasher
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/40",
              )}
            >
              Dishwasher
            </button>
            <button
              type="button"
              onClick={() => setKitchen({ grill: !value.kitchen.grill })}
              className={cn(
                "border px-3 py-1.5 text-sm transition-colors",
                value.kitchen.grill
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/40",
              )}
            >
              Outdoor grill
            </button>
          </div>
          {config.kitchenProfiles.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-xs text-muted-foreground">Saved kitchens</p>
              <div className="flex flex-wrap gap-1.5">
                {config.kitchenProfiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setKitchen(p.kitchen)}
                    className="border border-border bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Field>

        <Field label="Hands available" explain={EXPLAIN.helpers}>
          <Segmented<number>
            value={value.helpers}
            onSelect={(helpers) => set({ helpers })}
            options={[
              { value: 0, label: "Solo" },
              { value: 1, label: "+1 helper" },
              { value: 2, label: "+2 helpers" },
              { value: 3, label: "+3 helpers" },
            ]}
          />
        </Field>

        <Field label="Ambition" hint="course count and hands-on tolerance" explain={EXPLAIN.ambition}>
          <Segmented<1 | 2 | 3>
            value={value.ambition}
            onSelect={(ambition) => set({ ambition })}
            options={[
              { value: 1, label: "Restrained" },
              { value: 2, label: "Considered" },
              { value: 3, label: "Full table" },
            ]}
          />
        </Field>

        <Field label="Season" hint="drives which fixtures read correctly" explain={EXPLAIN.season}>
          <Segmented<Conditions["season"]>
            value={value.season}
            onSelect={(season) => set({ season })}
            options={[
              { value: "spring", label: "Spring" },
              { value: "summer", label: "Summer" },
              { value: "autumn", label: "Autumn" },
              { value: "winter", label: "Winter" },
              { value: "year-round", label: "Any" },
            ]}
          />
        </Field>

        <Field label="Budget tier" hint="per-head ceiling, indicative only" explain={EXPLAIN.budget}>
          <Segmented<Conditions["budgetTier"]>
            value={value.budgetTier}
            onSelect={(budgetTier) => set({ budgetTier })}
            options={[
              { value: 1, label: `Modest · ${BUDGET_CEILING[1]}/head` },
              { value: 2, label: `Considered · ${BUDGET_CEILING[2]}/head` },
              { value: 3, label: `Unconstrained · ${BUDGET_CEILING[3]}/head` },
            ]}
          />
        </Field>

        <Field label="Leftovers goal" hint="sets batch volume honestly" explain={EXPLAIN.leftovers}>
          <Segmented<Conditions["leftovers"]>
            value={value.leftovers}
            onSelect={(leftovers) => set({ leftovers })}
            options={[
              { value: "none", label: "None" },
              { value: "some", label: "Some" },
              { value: "deliberate", label: "Deliberate" },
            ]}
          />
        </Field>

        <Field label="Room conditions" explain={EXPLAIN.room}>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => set({ kids: !value.kids })}
              className={cn(
                "border px-3 py-1.5 text-sm transition-colors",
                value.kids
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/40",
              )}
            >
              Children at the table
            </button>
            <button
              type="button"
              onClick={() => set({ outdoor: !value.outdoor })}
              className={cn(
                "border px-3 py-1.5 text-sm transition-colors",
                value.outdoor
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/40",
              )}
            >
              Usable outdoor space
            </button>
          </div>
        </Field>

        <Field label="Dietary categories" hint="planning filters — not allergy guarantees" explain={EXPLAIN.diets}>
          <div className="flex flex-wrap gap-1.5">
            {DIETS.map((d) => {
              const on = value.diets.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    set({ diets: on ? value.diets.filter((x) => x !== d) : [...value.diets, d] })
                  }
                  className={cn(
                    "border px-3 py-1.5 text-sm transition-colors",
                    on
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-card hover:border-foreground/40",
                  )}
                >
                  {DIET_LABELS[d]}
                </button>
              );
            })}
          </div>
          <p className="mt-3 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
            These filters remove conflicting fixture dishes from the route. They do not verify
            labels, cross-contact, or supplier changes. Confirm every ingredient yourself.
          </p>
        </Field>

        <Field
          label="Culinary traditions"
          hint="attribution, not an authenticity claim"
        >
          <div className="flex flex-wrap gap-1.5">
            {CUISINES.map((c) => {
              const on = (value.cuisines ?? []).includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    const cur = value.cuisines ?? [];
                    set({ cuisines: on ? cur.filter((x) => x !== c) : [...cur, c] });
                  }}
                  className={cn(
                    "min-h-11 border px-3 py-1.5 text-sm transition-colors",
                    on
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card hover:border-foreground/40",
                  )}
                >
                  {CUISINE_LABELS[c]}
                </button>
              );
            })}
          </div>
          <p className="mt-3 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
            No selection means no restriction. Selecting traditions narrows the library the engine
            may draw from; it does not make a dish regionally authoritative.
          </p>
        </Field>


      </div>

      <OpsPanel value={value} onChange={onChange} />
    </div>
  );
}

