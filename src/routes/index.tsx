import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ConditionsPanel } from "@/components/oos/ConditionsPanel";
import { PlanSurface } from "@/components/oos/PlanSurface";
import { HostPacket } from "@/components/oos/HostPacket";
import { signalClass } from "@/components/oos/Signals";
import { HostChrome } from "@/components/oos/HostChrome";
import { ScenarioGallery } from "@/components/oos/ScenarioGallery";
import { RunConsole } from "@/components/oos/RunConsole";
import { DecisionPacket } from "@/components/oos/DecisionPacket";
import { ServiceRunner } from "@/components/oos/ServiceRunner";
import { useT } from "@/lib/i18n";
import { DEFAULT_CONDITIONS, buildPlan } from "@/lib/oos/engine";
import { takeApply } from "@/lib/architecture/apply";
import { filterByCuisine, resolveLibrary } from "@/lib/oos/library";
import { saveScenario, useConfig } from "@/lib/oos/store";
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

interface Variant {
  id: string;
  label: string;
  plan: Plan;
}

function Index() {
  const config = useConfig();
  const { t } = useT();
  const all = useMemo(() => resolveLibrary(config), [config]);
  const [conditions, setConditions] = useState<Conditions>(DEFAULT_CONDITIONS);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [built, setBuilt] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  /** signature of the conditions the last completed run committed */
  const [committedSig, setCommittedSig] = useState<string | null>(null);
  const [architectureNote, setArchitectureNote] = useState<string | null>(null);

  // Consume Architecture → Plan handoff (explicit, one-shot session payload).
  useEffect(() => {
    const applied = takeApply();
    if (!applied) return;
    setConditions(applied.conditions);
    setBuilt(false);
    setCommittedSig(null);
    setArchitectureNote(
      applied.thesis
        ? `Architecture applied: ${applied.label}. ${applied.thesis}`
        : `Architecture applied: ${applied.label}. Rebuild the route to sequence the night.`,
    );
  }, []);


  const library = useMemo(
    () => filterByCuisine(all, conditions.cuisines ?? []),
    [all, conditions.cuisines],
  );

  const plan = useMemo(() => buildPlan(conditions, library), [conditions, library]);
  const stale = committedSig !== null && committedSig !== plan.signature;

  const saveVariant = () =>
    setVariants((v) =>
      [...v, { id: `${Date.now()}`, label: conditions.label || plan.signature, plan }].slice(-3),
    );


  return (
    <div className="min-h-dvh">
      {/* Masthead — layer switch Plan | Architecture | Card */}
      <HostChrome showPrint />
      {architectureNote && (
        <div role="status" className="no-print border-b border-border bg-secondary">
          <div className="mx-auto max-w-6xl px-5 py-3 text-sm leading-relaxed">
            <span className="rule-label">Architecture → Plan</span>
            <p className="mt-1">{architectureNote}</p>
          </div>
        </div>
      )}

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
            <span className="rule-label text-brass">{t("hero.eyebrow")}</span>
            <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
              {t("hero.title.1")}
              <br />
              {t("hero.title.2")}
              <em className="not-italic text-brass"> {t("hero.title.3")}</em>
              <br />
              {t("hero.title.4")}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted">
              {t("hero.body")}
            </p>
          </div>
          <div className="self-end border border-ink-muted/30 bg-ink/70 p-6 backdrop-blur-sm">
            <span className="rule-label text-brass">{t("hero.boundary")}</span>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {t("hero.boundary.body")}
            </p>
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className="no-print border-b border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="rule-label">{t("scen.eyebrow")}</span>
              <h2 className="mt-1 text-2xl tracking-tight">{t("scen.title")}</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("scen.body")}</p>
            </div>
            <Link
              to="/library"
              className="border border-foreground px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
            >
              {t("scen.tune")}
            </Link>
          </div>
          <div className="mt-7">
            <ScenarioGallery
              activeLabel={conditions.label}
              current={conditions}
              onLoad={(patch) => {
                setConditions({ ...DEFAULT_CONDITIONS, ...patch } as Conditions);
                setBuilt(true);
              }}
            />
          </div>
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
                {built ? t("work.rebuild") : t("work.build")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConditions(DEFAULT_CONDITIONS);
                  setBuilt(false);
                }}
                className="border border-border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                {t("work.reset")}
              </button>
            </div>
          </div>

          <div>
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <div>
                <span className="rule-label">{t("work.section02")}</span>
                <h2 className="mt-1 text-2xl tracking-tight">{t("work.route")}</h2>
              </div>
              {built && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={saveVariant}
                    className="border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground"
                  >
                    {t("work.saveVariation")}
                  </button>
                  <input
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    maxLength={60}
                    placeholder={t("work.nameConditions")}
                    className="border border-border bg-card px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={!scenarioName.trim()}
                    onClick={() => {
                      saveScenario(scenarioName.trim(), plan.signature, conditions);
                      setScenarioName("");
                    }}
                    className="border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground disabled:opacity-40"
                  >
                    {t("work.saveScenario")}
                  </button>
                </div>
              )}
            </div>

            {built ? (
              <>
                <p role="status" aria-live="polite" className="sr-only">
                  {plan.stops.length ? t("work.stopsPresent") : t("work.rebuilt")}
                </p>
                {/* Small screens keep the verdict in view while the conditions scroll. */}
                <div className="no-print sticky top-14 z-10 mb-4 flex items-center justify-between gap-3 border border-border bg-background/95 px-4 py-2 backdrop-blur lg:hidden">
                  <span className="rule-label">{t("tbl.feasibility")}</span>
                  <span className={cn("font-mono text-sm tabular-nums", signalClass(plan.verdict))}>
                    {plan.feasibility}/100 · {plan.stops.length} {t("tbl.stops").toLowerCase()}
                  </span>
                </div>
                <PlanSurface plan={plan} />
              </>
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
                  <h3 className="text-2xl tracking-tight">{t("work.empty.title")}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{t("work.empty.body")}</p>
                  <ol className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                      ["01", t("work.step1"), t("work.step1.body")],
                      ["02", t("work.step2"), t("work.step2.body")],
                      ["03", t("work.step3"), t("work.step3.body")],
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

        {/* Run control */}
        <div className="mt-16">
          <RunConsole
            conditions={conditions}
            library={library}
            stale={stale}
            committed={built}
            onCommit={(p) => {
              setBuilt(true);
              setCommittedSig(p.signature);
            }}
            onRestore={(c) => {
              setConditions(c);
              setBuilt(true);
            }}
          />
        </div>

        {/* Decision packet and live service */}
        {built && (
          <div className="mt-16 space-y-16">
            <DecisionPacket plan={plan} library={library} />
            <ServiceRunner plan={plan} />
          </div>
        )}

        {/* Variations */}
        {built && variants.length > 0 && (
          <section className="no-print mt-16">
            <span className="rule-label">{t("work.section03")}</span>
            <h2 className="mt-1 text-2xl tracking-tight">{t("work.variations")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t("work.variations.body")}
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-sm">
                <thead>
                  <tr className="border-y border-foreground">
                    <th className="py-2 text-left rule-label">{t("tbl.variation")}</th>
                    <th className="py-2 text-right rule-label">{t("tbl.guests")}</th>
                    <th className="py-2 text-right rule-label">{t("tbl.feasibility")}</th>
                    <th className="py-2 text-right rule-label">{t("tbl.oven")}</th>
                    <th className="py-2 text-right rule-label">{t("tbl.labour")}</th>
                    <th className="py-2 text-right rule-label">{t("tbl.stops")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...variants, { id: "current", label: t("tbl.current"), plan }].map((v) => {
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
              {t("work.clearVariations")}
            </button>
          </section>
        )}

        {/* Packet */}
        {built && (
          <section className="mt-16">
            <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="rule-label">{t("work.section04")}</span>
                <h2 className="mt-1 text-2xl tracking-tight">{t("work.packet")}</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("work.packet.body")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pdfBusy}
                  onClick={async () => {
                    setPdfBusy(true);
                    try {
                      await planPdf(plan, styleForTheme(theme));
                      log("info", "pdf.packet", `Host packet PDF written for ${plan.signature}`);
                    } catch (error) {
                      logError("pdf.packet", error, { signature: plan.signature });
                    } finally {
                      setPdfBusy(false);
                    }
                  }}
                  className="bg-foreground px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {pdfBusy ? "…" : t("ho.pdf")}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="border border-border bg-card px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors hover:border-foreground"
                >
                  {t("action.print")}
                </button>
              </div>
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
              href="https://deepdish.saltnotes.blog"
              target="_blank"
              rel="noreferrer noopener"
              className="block hover:text-ink-foreground"
            >
              {t("nav.restaurant")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
