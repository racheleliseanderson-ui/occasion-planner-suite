import { createFileRoute, Link } from "@tanstack/react-router";
import { HostChrome } from "@/components/oos/HostChrome";
import { getRecipe } from "@/lib/architecture/recipes";
import { catalogName } from "@/lib/architecture/bridge";

export const Route = createFileRoute("/recipes/$dishId")({
  head: ({ params }) => ({
    meta: [
      {
        title: `${getRecipe(params.dishId)?.dishId ?? params.dishId} — recipe · Occasion OS`,
      },
      {
        name: "description",
        content: "Planning recipe for an Architecture dish. Educational — not a certified kitchen test.",
      },
    ],
  }),
  component: RecipePage,
});

function RecipePage() {
  const { dishId } = Route.useParams();
  const recipe = getRecipe(dishId);
  const name = catalogName(dishId) ?? dishId;

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
            No planning recipe is filed for this dish yet. Return to Architecture and choose another role.
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
        <Link
          to="/architecture"
          search={{ p: undefined }}
          className="inline-flex min-h-11 items-center border border-foreground px-4 py-2 font-mono text-[11px] uppercase tracking-widest hover:bg-foreground hover:text-background"
        >
          Return to Architecture
        </Link>
      </main>
    </div>
  );
}
