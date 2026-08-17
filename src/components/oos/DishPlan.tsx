import { Link } from "@tanstack/react-router";
import { roleLabel } from "@/lib/architecture/labels";
import type { DishPlanBlock } from "@/lib/architecture/types";
import { getRecipe } from "@/lib/architecture/recipes";
import { cn } from "@/lib/utils";

export function DishPlan({
  plan,
  lockedAnchorId,
  pairingMode,
  pairingModeNote,
  onLockAnchor,
}: {
  plan: DishPlanBlock[];
  lockedAnchorId?: string | null;
  pairingMode?: string;
  pairingModeNote?: string;
  onLockAnchor: (id: string) => void;
}) {
  return (
    <section className="space-y-4" aria-labelledby="dish-plan-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="rule-label">Compose</span>
          <h3 id="dish-plan-title" className="mt-1 font-display text-2xl tracking-tight">
            Suggested dishes
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Flavor-family tags are planning signals, not molecular proof. Lock an
            anchor to re-score the rest of the menu against it.
          </p>
        </div>
        {pairingMode ? (
          <span className="border border-brass px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-brass">
            Pairing · {pairingMode}
          </span>
        ) : null}
      </div>
      {pairingModeNote ? (
        <p className="text-sm text-muted-foreground">{pairingModeNote}</p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {plan.map((block) => {
          const p = block.primary;
          const isAnchor = block.role === "anchor";
          const locked = Boolean(isAnchor && lockedAnchorId && p?.id === lockedAnchorId);

          return (
            <article
              key={block.role}
              className={cn(
                "flex flex-col border border-border bg-card p-4",
                isAnchor && "md:col-span-2",
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
                    Locked
                  </span>
                ) : null}
              </div>

              {!p ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No catalog dish cleared every constraint for this role.
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

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(p.flavorFamilies || []).map((f) => (
                      <span
                        key={f}
                        className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>

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
                    {p.richness ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>{p.richness}</span>
                      </>
                    ) : null}
                  </div>

                  {getRecipe(p.id) ? (
                    <Link
                      to="/recipes/$dishId"
                      params={{ dishId: p.id }}
                      className="mt-3 font-mono text-[11px] uppercase tracking-widest text-brass underline-offset-4 hover:underline"
                    >
                      Open recipe →
                    </Link>
                  ) : null}

                  {isAnchor ? (
                    <button
                      type="button"
                      className="mt-4 min-h-11 border border-foreground px-3 py-2 font-mono text-[11px] uppercase tracking-widest hover:bg-foreground hover:text-background"
                      onClick={() => onLockAnchor(p.id)}
                    >
                      {locked ? "Anchor locked" : "Lock this anchor"}
                    </button>
                  ) : null}

                  {(block.alternatives || []).length > 0 ? (
                    <details className="mt-3 border-t border-border pt-3">
                      <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-widest text-brass">
                        Alternatives
                      </summary>
                      <ul className="mt-2 space-y-3">
                        {block.alternatives.map((a) => (
                          <li key={a.id} className="text-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <strong>{a.name}</strong>
                                <span className="text-muted-foreground"> — {a.blurb}</span>
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
                              </div>
                              {isAnchor ? (
                                <button
                                  type="button"
                                  className="min-h-11 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest hover:border-foreground"
                                  onClick={() => onLockAnchor(a.id)}
                                >
                                  Lock as anchor
                                </button>
                              ) : null}
                            </div>
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
