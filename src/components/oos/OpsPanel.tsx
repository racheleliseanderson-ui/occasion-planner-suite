import { useState } from "react";
import type { Conditions, Ops } from "@/lib/oos/types";
import { withDefaults } from "@/lib/oos/ops";
import { EXPLAIN } from "@/lib/oos/explain";
import { Field, Segmented, Stepper, Toggle } from "./controls";
import { cn } from "@/lib/utils";

/**
 * Extended operating conditions, grouped so the panel stays readable.
 * Every control here changes the plan; nothing is cosmetic.
 */

type Group = "table" | "crowd" | "constraint" | "outdoor" | "general";

const GROUPS: { key: Group; label: string; explain: string }[] = [
  { key: "table", label: "Table", explain: EXPLAIN.table },
  { key: "crowd", label: "Crowd", explain: EXPLAIN.crowd },
  { key: "constraint", label: "Constraints", explain: EXPLAIN.constraint },
  { key: "outdoor", label: "Outdoor", explain: EXPLAIN.outdoorOps },
  { key: "general", label: "Host", explain: EXPLAIN.general },
];

export function OpsPanel({
  value,
  onChange,
}: {
  value: Conditions;
  onChange: (next: Conditions) => void;
}) {
  const ops = withDefaults(value.ops);
  const [open, setOpen] = useState<Group | null>(null);

  function patch<K extends Group>(key: K, next: Partial<Ops[K]>) {
    onChange({ ...value, ops: { ...ops, [key]: { ...ops[key], ...next } } });
  }

  return (
    <div className="border-t border-border">
      <div className="px-6 py-5">
        <span className="rule-label">Section 01b</span>
        <h3 className="mt-1 text-xl tracking-tight">Declared limits</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a group and state what is actually true. Each one tightens the model before the route
          is built.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              aria-expanded={open === g.key}
              onClick={() => setOpen(open === g.key ? null : g.key)}
              className={cn(
                "min-h-11 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors sm:min-h-0",
                open === g.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/40",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div className="space-y-5 border-t border-border bg-secondary/40 px-6 py-5">
          <p className="border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
            {GROUPS.find((g) => g.key === open)?.explain}
          </p>

          {open === "table" && (
            <>
              <Field label="Tables and seats">
                <div className="flex flex-wrap items-center gap-3">
                  <Stepper label="tables" value={ops.table.tables} min={0} max={12} suffix="tables" onSet={(tables) => patch("table", { tables })} />
                  <Stepper label="seats per table" value={ops.table.seatsPerTable} min={2} max={20} suffix="each" onSet={(seatsPerTable) => patch("table", { seatsPerTable })} />
                </div>
              </Field>
              <Field label="Courses served" hint="drives how many plates are built">
                <Stepper label="courses" value={ops.table.courses} min={1} max={6} onSet={(courses) => patch("table", { courses })} />
              </Field>
              <Field label="Service mode">
                <Segmented<Ops["table"]["serviceMode"]>
                  label="Service mode"
                  value={ops.table.serviceMode}
                  onSelect={(serviceMode) => patch("table", { serviceMode })}
                  options={[
                    { value: "plated", label: "Plated" },
                    { value: "family", label: "Family style" },
                    { value: "passed", label: "Passed" },
                  ]}
                />
              </Field>
              <Field label="Table-side finishing">
                <Toggle on={ops.table.tablesideFinishing} onToggle={() => patch("table", { tablesideFinishing: !ops.table.tablesideFinishing })}>
                  Finish a dish in front of guests
                </Toggle>
              </Field>
            </>
          )}

          {open === "crowd" && (
            <>
              <Field label="Standing share" hint={`${Math.round(ops.crowd.standingShare * 100)}% standing`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  aria-label="Standing share"
                  value={Math.round(ops.crowd.standingShare * 100)}
                  onChange={(e) => patch("crowd", { standingShare: Number(e.target.value) / 100 })}
                  className="w-full accent-[var(--color-foreground)]"
                />
              </Field>
              <Field label="Arrival spread" hint="checked against how long dishes hold">
                <Stepper label="arrival spread" value={ops.crowd.arrivalSpreadMin} min={0} max={180} step={5} suffix="min" onSet={(arrivalSpreadMin) => patch("crowd", { arrivalSpreadMin })} />
              </Field>
              <Field label="Serving stations" hint="about 14 guests each">
                <Stepper label="stations" value={ops.crowd.stations} min={1} max={8} onSet={(stations) => patch("crowd", { stations })} />
              </Field>
              <Field label="Refill cadence">
                <Stepper label="refill cadence" value={ops.crowd.refillCadenceMin} min={5} max={120} step={5} suffix="min" onSet={(refillCadenceMin) => patch("crowd", { refillCadenceMin })} />
              </Field>
              <Field label="Who serves">
                <Toggle on={ops.crowd.selfServe} onToggle={() => patch("crowd", { selfServe: !ops.crowd.selfServe })}>
                  Guests serve themselves
                </Toggle>
              </Field>
            </>
          )}

          {open === "constraint" && (
            <>
              <Field label="Sink and wash space">
                <Segmented<Ops["constraint"]["sink"]>
                  label="Sink"
                  value={ops.constraint.sink}
                  onSelect={(sink) => patch("constraint", { sink })}
                  options={[
                    { value: "scarce", label: "Scarce" },
                    { value: "single", label: "Single bowl" },
                    { value: "double", label: "Double bowl" },
                  ]}
                />
              </Field>
              <Field label="Usable prep surfaces" hint="overrides counter size at the extremes">
                <Stepper label="prep surfaces" value={ops.constraint.prepSurfaces} min={0} max={6} onSet={(prepSurfaces) => patch("constraint", { prepSurfaces })} />
              </Field>
              <Field label="Hard equipment limits">
                <div className="flex flex-wrap gap-1.5">
                  <Toggle on={ops.constraint.singleBurnerMode} onToggle={() => patch("constraint", { singleBurnerMode: !ops.constraint.singleBurnerMode })}>
                    Single-burner mode
                  </Toggle>
                  <Toggle on={ops.constraint.noOvenMode} onToggle={() => patch("constraint", { noOvenMode: !ops.constraint.noOvenMode })}>
                    No oven at all
                  </Toggle>
                  <Toggle on={ops.constraint.powerLimited} onToggle={() => patch("constraint", { powerLimited: !ops.constraint.powerLimited })}>
                    Limited power
                  </Toggle>
                  <Toggle on={ops.constraint.curfew} onToggle={() => patch("constraint", { curfew: !ops.constraint.curfew })}>
                    Noise or finish-by curfew
                  </Toggle>
                  <Toggle on={ops.constraint.pantryOnly} onToggle={() => patch("constraint", { pantryOnly: !ops.constraint.pantryOnly })}>
                    Pantry only
                  </Toggle>
                </div>
              </Field>
              <Field label="Extra cool boxes" hint="adds 4 shelf units each">
                <Stepper label="cool boxes" value={ops.constraint.coldBoxes} min={0} max={6} onSet={(coldBoxes) => patch("constraint", { coldBoxes })} />
              </Field>
              <Field label="Shopping trips available">
                <Stepper label="shopping trips" value={ops.constraint.shoppingTrips} min={0} max={5} onSet={(shoppingTrips) => patch("constraint", { shoppingTrips })} />
              </Field>
              <Field label="Hard per-head cap" hint="overrides the budget tier and becomes a stop">
                <div className="flex flex-wrap items-center gap-3">
                  <Toggle
                    on={ops.constraint.hardCapPerHead !== null}
                    onToggle={() => patch("constraint", { hardCapPerHead: ops.constraint.hardCapPerHead === null ? 15 : null })}
                  >
                    {ops.constraint.hardCapPerHead === null ? "No hard cap" : "Cap enforced"}
                  </Toggle>
                  {ops.constraint.hardCapPerHead !== null && (
                    <Stepper label="hard cap" value={ops.constraint.hardCapPerHead} min={1} max={120} suffix="/head" onSet={(hardCapPerHead) => patch("constraint", { hardCapPerHead })} />
                  )}
                </div>
              </Field>
            </>
          )}

          {open === "outdoor" && (
            <>
              <Field label="Outdoor heat">
                <Segmented<Ops["outdoor"]["grillType"]>
                  label="Grill type"
                  value={ops.outdoor.grillType}
                  onSelect={(grillType) => patch("outdoor", { grillType })}
                  options={[
                    { value: "none", label: "None" },
                    { value: "gas", label: "Gas" },
                    { value: "charcoal", label: "Charcoal" },
                    { value: "kamado", label: "Kamado" },
                  ]}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Toggle on={ops.outdoor.smoker} onToggle={() => patch("outdoor", { smoker: !ops.outdoor.smoker })}>
                    Smoker
                  </Toggle>
                  <Toggle on={ops.outdoor.firePit} onToggle={() => patch("outdoor", { firePit: !ops.outdoor.firePit })}>
                    Fire pit
                  </Toggle>
                </div>
              </Field>
              <Field label="Services outside">
                <div className="flex flex-wrap gap-1.5">
                  <Toggle on={ops.outdoor.power} onToggle={() => patch("outdoor", { power: !ops.outdoor.power })}>
                    Power
                  </Toggle>
                  <Toggle on={ops.outdoor.water} onToggle={() => patch("outdoor", { water: !ops.outdoor.water })}>
                    Water
                  </Toggle>
                  <Toggle on={ops.outdoor.shade} onToggle={() => patch("outdoor", { shade: !ops.outdoor.shade })}>
                    Shade
                  </Toggle>
                  <Toggle on={ops.outdoor.insectPressure} onToggle={() => patch("outdoor", { insectPressure: !ops.outdoor.insectPressure })}>
                    Insect pressure
                  </Toggle>
                </div>
              </Field>
              <Field label="Weather risk">
                <Segmented<Ops["outdoor"]["weatherRisk"]>
                  label="Weather risk"
                  value={ops.outdoor.weatherRisk}
                  onSelect={(weatherRisk) => patch("outdoor", { weatherRisk })}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                  ]}
                />
              </Field>
              <Field label="Carry and cold" hint="transport is checked against hold time">
                <div className="flex flex-wrap items-center gap-3">
                  <Stepper label="transport" value={ops.outdoor.transportMin} min={0} max={120} step={5} suffix="min" onSet={(transportMin) => patch("outdoor", { transportMin })} />
                  <Stepper label="cooler capacity" value={ops.outdoor.coolerCapacity} min={0} max={20} suffix="units" onSet={(coolerCapacity) => patch("outdoor", { coolerCapacity })} />
                </div>
              </Field>
            </>
          )}

          {open === "general" && (
            <>
              <Field label="Kitchen skill" hint="scales every hands-on estimate">
                <Segmented<Ops["general"]["skill"]>
                  label="Skill"
                  value={ops.general.skill}
                  onSelect={(skill) => patch("general", { skill })}
                  options={[
                    { value: 1, label: "Cautious · 1.3x" },
                    { value: 2, label: "Confident · 1x" },
                    { value: 3, label: "Practised · 0.85x" },
                  ]}
                />
              </Field>
              <Field label="Alcohol">
                <Toggle on={ops.general.alcohol} onToggle={() => patch("general", { alcohol: !ops.general.alcohol })}>
                  {ops.general.alcohol ? "Alcohol served" : "Alcohol-free house"}
                </Toggle>
              </Field>
              <Field label="Service duration">
                <Stepper label="service duration" value={ops.general.serviceDurationMin} min={30} max={360} step={15} suffix="min" onSet={(serviceDurationMin) => patch("general", { serviceDurationMin })} />
              </Field>
              <Field label="Recovery window" hint="its own gauge">
                <Stepper label="cleanup window" value={ops.general.cleanupWindowMin} min={15} max={240} step={15} suffix="min" onSet={(cleanupWindowMin) => patch("general", { cleanupWindowMin })} />
              </Field>
              <Field label="Dietary strictness">
                <Segmented<Ops["general"]["dietStrictness"]>
                  label="Dietary strictness"
                  value={ops.general.dietStrictness}
                  onSelect={(dietStrictness) => patch("general", { dietStrictness })}
                  options={[
                    { value: "preference", label: "Preference" },
                    { value: "strict", label: "Strict avoidance" },
                  ]}
                />
              </Field>
            </>
          )}
        </div>
      )}
    </div>
  );
}
