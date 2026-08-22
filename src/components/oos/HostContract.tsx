import type { Plan } from "@/lib/oos/types";
import { hasPlanningRecipe } from "@/lib/oos/planningRecipe";
import { cn } from "@/lib/utils";

/**
 * Host-facing contract: declared inputs in, controlled outputs out.
 * If a row cannot be honoured, it says so — nothing is left to chance.
 */
export function HostContract({ plan, evaluated }: { plan: Plan; evaluated: boolean }) {
  const c = plan.conditions;
  const seatingOk = c.style !== "seated" || c.seatingKnown !== false;
  const drinks = plan.menu.filter((m) => m.dish.course === "drink" && m.dish.id !== "non-food-service");
  const pairings = plan.menu.filter((m) => m.dish.winePairing);
  const recipes = plan.menu.filter((m) => hasPlanningRecipe(m.dish.id));
  const tight = plan.gauges.filter((g) => g.pct >= 78);
  const blocked = plan.stops.length > 0;

  const rows: { label: string; detail: string; state: "ready" | "blocked" | "pending" }[] = [
    {
      label: "Guests",
      detail: `${c.guests} counted`,
      state: "ready",
    },
    {
      label: "Seating",
      detail: seatingOk
        ? c.style === "seated"
          ? `${c.kitchen.seats} declared seats`
          : `${c.style} — seats not the cap`
        : "Not declared — will not invent chairs",
      state: seatingOk ? "ready" : "blocked",
    },
    {
      label: "Equipment",
      detail: `${c.kitchen.ovens} oven · ${c.kitchen.burners} burners · ${c.kitchen.fridge} fridge${c.kitchen.grill ? " · grill" : ""}`,
      state: "ready",
    },
    {
      label: "Dietary filters",
      detail: c.diets.length ? c.diets.join(", ") : "None declared — confirm ingredients yourself",
      state: "ready",
    },
    {
      label: "Drinks",
      detail: evaluated
        ? drinks.length
          ? drinks.map((d) => d.dish.name).join(" · ")
          : "No pour survived"
        : `${c.beverageRoute ?? "wine"} declared`,
      state: !evaluated ? "pending" : drinks.length ? "ready" : "blocked",
    },
    {
      label: "Shopping list",
      detail: evaluated ? `${plan.shopping.length} lines` : "Built after you evaluate",
      state: !evaluated ? "pending" : plan.shopping.length ? "ready" : "blocked",
    },
    {
      label: "Prep clock",
      detail: evaluated ? `${plan.timeline.length} timed tasks` : "Built after you evaluate",
      state: !evaluated ? "pending" : plan.timeline.length ? "ready" : "blocked",
    },
    {
      label: "Wine and drink pairings",
      detail: evaluated
        ? pairings.length
          ? `${pairings.length} dishes carry pairing notes`
          : "No pairing notes on this route"
        : "Filed against each dish",
      state: !evaluated ? "pending" : pairings.length ? "ready" : "pending",
    },
    {
      label: "Recipe cards",
      detail: evaluated ? `${recipes.length}/${plan.menu.length} planning cards` : "One card per dish on the route",
      state: !evaluated ? "pending" : recipes.length === plan.menu.length && plan.menu.length > 0 ? "ready" : "pending",
    },
    {
      label: "Tight spots",
      detail: !evaluated
        ? "Named after you evaluate — or the plan stops"
        : blocked
          ? `${plan.stops.length} hard stop${plan.stops.length === 1 ? "" : "s"} · will not guess`
          : tight.length
            ? `${tight.map((g) => g.name).join(", ")} running tight`
            : `${plan.feasibility}/100 · ${plan.verdict}`,
      state: !evaluated ? "pending" : blocked ? "blocked" : "ready",
    },
  ];

  return (
    <section className="paper px-5 py-5 sm:px-6">
      <span className="rule-label">Host contract</span>
      <h3 className="mt-1 text-xl tracking-tight">Nothing is left to chance</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Guests, seats, real equipment, diets and drinks go in. Shopping, prep clock, pairings,
        recipe cards and an honest reading of where the evening is tight come out. If it cannot
        fit, the plan stops and says why.
      </p>
      <ul className="mt-4 divide-y divide-border border-t border-border">
        {rows.map((row) => (
          <li key={row.label} className="flex flex-wrap items-baseline justify-between gap-3 py-2">
            <span className="text-sm font-medium">{row.label}</span>
            <span
              className={cn(
                "font-mono text-[11px] uppercase tracking-widest",
                row.state === "blocked" && "text-signal-over",
                row.state === "ready" && "text-signal-controlled",
                row.state === "pending" && "text-muted-foreground",
              )}
            >
              {row.state === "blocked" ? "● Stopped" : row.state === "ready" ? "▲ Set" : "◆ Needs input"}
            </span>
            <p className="w-full text-sm text-muted-foreground">{row.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
