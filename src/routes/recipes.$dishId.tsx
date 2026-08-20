import { createFileRoute, Link } from "@tanstack/react-router";
import { HostChrome } from "@/components/oos/HostChrome";
import { resolvePlanningRecipe } from "@/lib/oos/planningRecipe";
import { FIXTURES } from "@/lib/oos/library";
import { editorialUrlForDish, HOUSE_ORIGIN } from "@/lib/house/atlas";

export const Route = createFileRoute("/recipes/$dishId")({
  head: ({ params }) => {
    const recipe = resolvePlanningRecipe(params.dishId);
    return {
      meta: [
        {
          title: `${recipe?.dishId ?? params.dishId} — planning recipe · Occasion OS`,
        },
        {
          name: "description",
          content: "Planning recipe for an Occasion OS dish. Educational — not a certified kitchen test.",
        },
      ],
    };
  },
  component: RecipePage,
});

function RecipePage() {
  const { dishId } = Route.useParams();
  const dish = FIXTURES.find((d) => d.id === dishId);
  const recipe = resolvePlanningRecipe(dishId, dish);
  const name = dish?.name ?? dishId;
  const editorial = editorialUrlForDish(dishId, name);

  return (
    <div className="min-h-dvh">
      <HostChrome />
      <section className="border-b border-border bg-ink text-ink-foreground">
        <div className="mx-auto max-w-3xl px-5 py-14">
          <span className="rule-label text-brass">Planning recipe</span>
          <h1 className="mt-3 font-display text-4xl leading-[1] tracking-tight sm:text-5xl">{name}</h1>
          {recipe && (
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-muted">{recipe.headnote}</p>
          )}
        </div>
      </section>
      <main className="mx-auto max-w-3xl space-y-10 px-5 py-14">
        {!recipe && (
          <p className="border-l-2 border-signal-over pl-4 text-sm">
            No planning recipe is filed for this id. Return to Discover and evaluate a route first.
          </p>
        )}
        {recipe && (
          <>
            <div className="flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span>{recipe.yield}</span>
              <span>{recipe.activeMinutes} min active</span>
              <span>{recipe.totalMinutes} min total</span>
              <span>{recipe.difficulty}</span>
            </div>
            {dish?.winePairing && (
              <section>
                <span className="rule-label">Wine / drink pairing</span>
                {dish.pairingWhy && <p className="mt-2 text-sm text-brass">{dish.pairingWhy}</p>}
                <p className="mt-2 text-sm leading-relaxed">{dish.winePairing}</p>
              </section>
            )}
            {dish?.leftoverNote && (
              <section>
                <span className="rule-label">Leftover route</span>
                <p className="mt-2 text-sm leading-relaxed">{dish.leftoverNote}</p>
              </section>
            )}
            <section>
              <span className="rule-label">Ingredients</span>
              <ul className="mt-3 divide-y divide-border border border-border bg-card">
                {recipe.ingredients.map((line) => (
                  <li key={line.item} className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <span>{line.item}</span>
                    <span className="font-mono text-xs text-muted-foreground">{line.amount}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <span className="rule-label">Method</span>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                {recipe.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="border-l-2 border-accent pl-3 text-sm leading-relaxed">
                <span className="rule-label">Make-ahead</span>
                <p className="mt-1">{recipe.makeAhead}</p>
              </div>
              <div className="border-l-2 border-accent pl-3 text-sm leading-relaxed">
                <span className="rule-label">Scaling</span>
                <p className="mt-1">{recipe.scalingNote}</p>
              </div>
            </section>
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="border-l-2 border-accent pl-3 text-sm leading-relaxed">
                <span className="rule-label">Equipment</span>
                <p className="mt-1">{recipe.equipment.join(" · ")}</p>
              </div>
              <div className="border-l-2 border-accent pl-3 text-sm leading-relaxed">
                <span className="rule-label">Planning filters</span>
                <p className="mt-1">{recipe.dietary.join(" · ") || "None declared"}</p>
              </div>
            </section>
          </>
        )}
        <div className="flex flex-wrap gap-2">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center border border-foreground px-4 py-2 font-mono text-[11px] uppercase tracking-widest hover:bg-foreground hover:text-background"
          >
            Return to Discover
          </Link>
          <Link
            to="/architecture"
            search={{ p: undefined }}
            className="inline-flex min-h-11 items-center border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest hover:border-foreground"
          >
            Return to Compose
          </Link>
          {editorial ? (
            <a
              href={editorial}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-11 items-center border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest hover:border-foreground"
            >
              Read the related piece on the site ↗
            </a>
          ) : (
            <a
              href={`${HOUSE_ORIGIN}/recipes/`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-11 items-center border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest hover:border-foreground"
            >
              Recipes and Technique ↗
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
