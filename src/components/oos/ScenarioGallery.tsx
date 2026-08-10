import type { Conditions } from "@/lib/oos/types";
import { SCENARIOS, type Scenario } from "@/lib/oos/scenarios";
import { deleteScenario, useConfig } from "@/lib/oos/store";
import { cn } from "@/lib/utils";

const FAMILIES: Scenario["family"][] = ["Table", "Crowd", "Constrained", "Outdoor"];

export function ScenarioGallery({
  onLoad,
  activeLabel,
}: {
  onLoad: (patch: Partial<Conditions>) => void;
  activeLabel: string;
}) {
  const config = useConfig();

  return (
    <div className="space-y-8">
      {FAMILIES.map((family) => (
        <div key={family}>
          <span className="rule-label">{family}</span>
          <div className="mt-3 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {SCENARIOS.filter((s) => s.family === family).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onLoad(s.patch)}
                className={cn(
                  "group bg-card px-4 py-4 text-left transition-colors hover:bg-secondary",
                  activeLabel === s.patch.label && "bg-secondary",
                )}
              >
                <span className="block text-sm">{s.label}</span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.note}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {config.savedScenarios.length > 0 && (
        <div>
          <span className="rule-label">Your saved conditions</span>
          <div className="mt-3 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {config.savedScenarios.map((s) => (
              <div key={s.id} className="bg-card px-4 py-4">
                <button
                  type="button"
                  onClick={() => onLoad(s.conditions as unknown as Partial<Conditions>)}
                  className="block w-full text-left"
                >
                  <span className="block text-sm">{s.name}</span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.note || "saved by you"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteScenario(s.id)}
                  className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-signal-over hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
