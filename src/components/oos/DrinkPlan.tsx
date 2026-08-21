import { Link } from "@tanstack/react-router";
import { roleLabel } from "@/lib/architecture/labels";
import type { DrinkPlanBlock } from "@/lib/architecture/types";
import { getRecipe } from "@/lib/architecture/recipes";
import { cn } from "@/lib/utils";

export function DrinkPlan({
  plan,
  lockedEqualId,
  beverageDirection,
  zeroProofDirection,
  mode,
}: {
  plan: DrinkPlanBlock[];
  lockedEqualId?: string | null;
  beverageDirection?: string;
  zeroProofDirection?: string;
  mode?: string;
}) {
  return (
    <section className="space-y-4" aria-labelledby="drink-plan-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="rule-label">Beverage route</span>
          <h3 id="drink-plan-title" className="mt-1 font-display text-2xl tracking-tight">
            Suggested drinks
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Arrival · Volume · Cut · Equal · Station — operational structure, not a
            cocktail generator. Equal-status zero-proof is required unless the route is
            alcoholic-only.
          </p>
        </div>
        {mode ? (
          <span className="border border-brass px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-brass">
            Route · {String(mode).replaceAll("_", " ")}
          </span>
        ) : null}
      </div>

      {(beverageDirection || zeroProofDirection) && (
        <div className="border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
          {beverageDirection ? <p>{beverageDirection}</p> : null}
          {zeroProofDirection ? (
            <p className={beverageDirection ? "mt-2" : undefined}>{zeroProofDirection}</p>
          ) : null}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {plan.map((block) => {
          const p = block.primary;
          const isEqual = block.role === "equal";
          const isStation = block.role === "station";
          const locked = Boolean(isEqual && lockedEqualId && p?.id === lockedEqualId);
          const hasRecipe = p ? Boolean(getRecipe(p.id)) : false;

          return (
            <article
              key={block.role}
              className={cn(
                "flex flex-col border border-border bg-card p-4",
                (isEqual || isStation) && "md:col-span-2",
                locked && "border-foreground",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="rule-label">
                  {roleLabel(block.role)}
                  {p ? ` · fit ${p.score}` : ""}
                </p>
                {locked ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-brass">
                    Locked equal
                  </span>
                ) : isEqual ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Equal-status required
                  </span>
                ) : null}
              </div>

              {!p ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No drink fixture cleared this role for the declared route.
                </p>
              ) : (
                <>
                  <h4 className="mt-2 font-display text-lg leading-snug tracking-tight">{p.name}</h4>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {p.blurb}
                  </p>
                  {p.why ? (
                    <p className="mt-2 text-xs text-muted-foreground">Why: {p.why}</p>
                  ) : null}

                  {(p.fitReasons || []).length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {p.fitReasons.map((r) => (
                        <li key={r} className="text-xs text-muted-foreground">
                          · {r}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span>{p.makeAhead ? "Make-ahead" : "Day-of"}</span>
                    <span aria-hidden>·</span>
                    <span>Heat: {p.heat}</span>
                    {hasRecipe ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>Recipe filed</span>
                      </>
                    ) : null}
                  </div>

                  {hasRecipe ? (
                    <Link
                      to="/recipes/$dishId"
                      params={{ dishId: p.id }}
                      className="mt-3 font-mono text-[11px] uppercase tracking-widest text-brass underline-offset-4 hover:underline"
                    >
                      Open recipe →
                    </Link>
                  ) : null}

                  {(block.alternatives || []).length > 0 ? (
                    <details className="mt-3 border-t border-border pt-3">
                      <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-widest text-brass">
                        Alternatives
                      </summary>
                      <ul className="mt-2 space-y-3">
                        {block.alternatives.map((a) => (
                          <li key={a.id} className="text-sm">
                            <strong>{a.name}</strong>
                            {a.blurb ? (
                              <span className="text-muted-foreground"> — {a.blurb}</span>
                            ) : null}
                            <em className="ml-1 text-muted-foreground">(fit {a.score})</em>
                            {getRecipe(a.id) ? (
                              <Link
                                to="/recipes/$dishId"
                                params={{ dishId: a.id }}
                                className="ml-2 font-mono text-[10px] uppercase tracking-widest text-brass underline-offset-4 hover:underline"
                              >
                                Recipe
                              </Link>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
