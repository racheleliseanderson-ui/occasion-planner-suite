import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ConditionsPanel } from "@/components/oos/ConditionsPanel";
import { PlanSurface } from "@/components/oos/PlanSurface";
import { HostPacket } from "@/components/oos/HostPacket";
import { signalClass } from "@/components/oos/Signals";
import { DEFAULT_CONDITIONS, buildPlan } from "@/lib/oos/engine";
import type { Conditions, Plan } from "@/lib/oos/types";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/oos-hero.jpg";
import prepImage from "@/assets/oos-prep.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Occasion Operating System — Host Planning Instrument" },
      {
        name: "description",
        content:
          "Turn guest count, seating, equipment reality and dietary filters into a controlled route: shopping list, prep clock, service sequence and a printable host decision packet.",
      },
      { property: "og:title", content: "Occasion Operating System — Host Planning Instrument" },
      {
        property: "og:description",
        content:
          "A precise planning instrument for hosting at home. Feasibility scoring, equipment-aware routes, prep clocks and a printable host packet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: Index,
});

const PRESETS: { label: string; note: string; patch: Partial<Conditions> }[] = [
  {
    label: "Winter table for eight",
    note: "Seated · one oven · one helper",
    patch: {
      label: "Winter table for eight",
      shape: "dinner",
      style: "seated",
      guests: 8,
      helpers: 1,
      prepWindowH: 5,
      ambition: 2,
      diets: [],
      kitchen: { ovens: 1, burners: 4, grill: false, dishwasher: true, fridge: "normal", counter: "medium", seats: 8 },
    },
  },
  {
    label: "Small-kitchen supper for six",
    note: "No dishwasher · two burners · tight fridge",
    patch: {
      label: "Small-kitchen supper for six",
      shape: "dinner",
      style: "seated",
      guests: 6,
      helpers: 0,
      prepWindowH: 3,
      ambition: 1,
      diets: [],
      kitchen: { ovens: 1, burners: 2, grill: false, dishwasher: false, fridge: "tight", counter: "small", seats: 6 },
    },
  },
  {
    label: "Standing reception for eighteen",
    note: "Grazing · plant-only · no oven pressure",
    patch: {
      label: "Standing reception for eighteen",
      shape: "reception",
      style: "grazing",
      guests: 18,
      helpers: 2,
      prepWindowH: 6,
      ambition: 2,
      diets: ["no-animal"],
      kitchen: { ovens: 1, burners: 4, grill: false, dishwasher: true, fridge: "roomy", counter: "large", seats: 6 },
    },
  },
];

interface Variant {
  id: string;
  label: string;
  plan: Plan;
}

function Index() {
  const [conditions, setConditions] = useState<Conditions>(DEFAULT_CONDITIONS);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [built, setBuilt] = useState(false);

  const plan = useMemo(() => buildPlan(conditions), [conditions]);

  const saveVariant = () =>
    setVariants((v) =>
      [...v, { id: `${Date.now()}`, label: conditions.label || plan.signature, plan }].slice(-3),
    );

  return (
    <div className="min-h-screen">
      {/* Masthead */}
      <header className="no-print sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-lg tracking-tight">Occasion Operating System</span>
            <span className="rule-label hidden sm:inline">Salty &amp; Clever</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://saltnotes.blog/restaurant-intelligence/"
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Restaurant Intelligence ↗
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="border border-foreground px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
            >
              Print packet
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="no-print relative isolate bg-ink text-ink-foreground">
        <img
          src={heroImage}
          alt="A dark walnut table being set at dusk, braise in an enamel pot under warm raking light"
          width={1920}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover opacity-65"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-24 sm:py-36 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="rule-label text-brass">Host planning instrument · v2</span>
            <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
              Plan the night
              <br />
              you can
              <em className="not-italic text-brass"> actually</em>
              <br />
              host.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted">
              Guest count, seating, real equipment, and dietary categories go in. A controlled route
              comes out — shopping, prep clock, service sequence, and an honest reading of where the
              evening is tight. Nothing is invented. When a plan cannot fit, it stops and tells you why.
            </p>
          </div>
          <div className="self-end border border-ink-muted/30 bg-ink/70 p-6 backdrop-blur-sm">
            <span className="rule-label text-brass">Boundary</span>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Educational planning only. Fixture menus, not tested recipes. Dietary categories are
              planning filters and carry no allergen safety guarantee. Capacity, equipment, and time
              constraints fail closed rather than guess.
            </p>
          </div>
        </div>
      </section>

      {/* Presets */}
      <section className="no-print border-b border-border bg-secondary">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-4">
          <span className="rule-label">Load a starting condition</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setConditions({ ...DEFAULT_CONDITIONS, ...p.patch } as Conditions);
                setBuilt(true);
              }}
              className="group border border-border bg-card px-3 py-2 text-left transition-colors hover:border-foreground"
            >
              <span className="block text-sm">{p.label}</span>
              <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {p.note}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Workspace */}
      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="no-print grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
          <div className="lg:sticky lg:top-20">
            <ConditionsPanel
              value={conditions}
              onChange={(next) => {
                setConditions(next);
                if (built) setBuilt(true);
              }}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBuilt(true)}
                className="flex-1 bg-foreground px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90"
              >
                {built ? "Rebuild route" : "Build controlled route"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConditions(DEFAULT_CONDITIONS);
                  setBuilt(false);
                }}
                className="border border-border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                Reset
              </button>
            </div>
          </div>

          <div>
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <div>
                <span className="rule-label">Section 02</span>
                <h2 className="mt-1 text-2xl tracking-tight">Controlled route</h2>
              </div>
              {built && (
                <button
                  type="button"
                  onClick={saveVariant}
                  className="border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground"
                >
                  Save as variation
                </button>
              )}
            </div>

            {built ? (
              <PlanSurface plan={plan} />
            ) : (
              <div className="paper grain overflow-hidden">
                <img
                  src={prepImage}
                  alt="Hands prepping herbs and citrus beside labelled cold-hold containers and a timing note"
                  width={1408}
                  height={1008}
                  loading="lazy"
                  className="h-56 w-full object-cover"
                />
                <div className="px-6 py-8">
                  <h3 className="text-2xl tracking-tight">Empty on purpose</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    Nothing is generated until conditions are declared. Set guests, seats, equipment
                    and hands on the left, then build. If the route cannot fit what you have, the
                    system blocks with a correction path rather than guessing.
                  </p>
                  <ol className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                      ["01", "Declare", "Guests, seats, ovens, burners, cold storage, hands, time."],
                      ["02", "Build", "A route scored against your real constraints."],
                      ["03", "Refine", "Adjust one input, compare variations, then print the packet."],
                    ].map(([n, t, d]) => (
                      <li key={n} className="border-t border-foreground pt-3">
                        <span className="rule-label">{n}</span>
                        <p className="mt-1 text-sm font-medium">{t}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{d}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Variations */}
        {built && variants.length > 0 && (
          <section className="no-print mt-16">
            <span className="rule-label">Section 03</span>
            <h2 className="mt-1 text-2xl tracking-tight">Variation comparison</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Saved assumptions held side by side. Compare the cost of one more guest, one fewer
              burner, or one lost helper before you commit.
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-sm">
                <thead>
                  <tr className="border-y border-foreground">
                    <th className="py-2 text-left rule-label">Variation</th>
                    <th className="py-2 text-right rule-label">Guests</th>
                    <th className="py-2 text-right rule-label">Feasibility</th>
                    <th className="py-2 text-right rule-label">Oven</th>
                    <th className="py-2 text-right rule-label">Labour</th>
                    <th className="py-2 text-right rule-label">Stops</th>
                  </tr>
                </thead>
                <tbody>
                  {[...variants, { id: "current", label: "Current build", plan }].map((v) => {
                    const oven = v.plan.gauges.find((g) => g.key === "oven");
                    const hands = v.plan.gauges.find((g) => g.key === "hands");
                    return (
                      <tr key={v.id} className="border-b border-border">
                        <td className="py-3">
                          <span className="block">{v.label}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {v.plan.signature}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums">{v.plan.conditions.guests}</td>
                        <td className={cn("py-3 text-right font-mono tabular-nums", signalClass(v.plan.verdict))}>
                          {v.plan.feasibility}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums">{oven ? `${oven.pct}%` : "—"}</td>
                        <td className="py-3 text-right font-mono tabular-nums">{hands ? `${hands.pct}%` : "—"}</td>
                        <td className="py-3 text-right font-mono tabular-nums">{v.plan.stops.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() => setVariants([])}
              className="mt-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Clear saved variations
            </button>
          </section>
        )}

        {/* Packet */}
        {built && (
          <section className="mt-16">
            <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="rule-label">Section 04</span>
                <h2 className="mt-1 text-2xl tracking-tight">Host decision packet</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  One document to carry into the kitchen. Prints clean on paper.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-foreground px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90"
              >
                Print packet
              </button>
            </div>
            <HostPacket plan={plan} />
          </section>
        )}
      </main>

      <footer className="no-print border-t border-border bg-ink text-ink-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-6 px-5 py-10 text-sm">
          <p className="max-w-xl leading-relaxed">
            Occasion Operating System is an educational host-planning instrument. It is not
            professional kitchen, medical, or legal advice. First-party fixtures only; no invented
            claims, no silent assumptions.
          </p>
          <div className="space-y-2 font-mono text-[11px] uppercase tracking-widest">
            <a href="https://saltnotes.blog" target="_blank" rel="noreferrer noopener" className="block hover:text-ink-foreground">
              Salty &amp; Clever ↗
            </a>
            <a
              href="https://saltnotes.blog/restaurant-intelligence/"
              target="_blank"
              rel="noreferrer noopener"
              className="block hover:text-ink-foreground"
            >
              Restaurant Intelligence ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
