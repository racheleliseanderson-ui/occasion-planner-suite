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
import { HostContract } from "@/components/oos/HostContract";
import { LabsFooter } from "@/components/oos/LabsFooter";
import { ServiceRunner } from "@/components/oos/ServiceRunner";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/hooks/use-theme";
import { planPdf, styleForTheme } from "@/lib/oos/pdf";
import { log, logError } from "@/lib/oos/log";
import { DEFAULT_CONDITIONS, buildPlan } from "@/lib/oos/engine";
import { takeApply } from "@/lib/architecture/apply";
import { takeVenueApply } from "@/lib/oos/venue-handoff";
import { filterByCuisine, normalise, resolveLibrary } from "@/lib/oos/library";
import { saveScenario, useConfig } from "@/lib/oos/store";
import type { Conditions, Dish, Plan } from "@/lib/oos/types";
import { cn } from "@/lib/utils";
import prepImage from "@/assets/oos-prep.jpg";
import heroTablescape from "@/assets/hero-tablescape.jpg";

/** Licensed tablescape from the house media library */
const HERO_IMAGE = heroTablescape;

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
  const [phase, setPhase] = useState<"draft" | "evaluated" | "committed">("draft");
  const [scenarioName, setScenarioName] = useState("");
  const [committedSig, setCommittedSig] = useState<string | null>(null);
  const [architectureNote, setArchitectureNote] = useState<string | null>(null);
  const [venueNote, setVenueNote] = useState<string | null>(null);
  const [overlayDishes, setOverlayDishes] = useState<Dish[]>([]);
  const [pdfBusy, setPdfBusy] = useState(false);
  const { theme, cvd } = useTheme();

  // Compose → Discover handoff (one-shot session payload).
  useEffect(() => {
    const applied = takeApply();
    if (!applied) return;
    setConditions(applied.conditions);
    setOverlayDishes(applied.overlayDishes ?? []);
    setPhase("evaluated");
    setCommittedSig(null);
    const locked = applied.conditions.lockedMenu;
    const seatNote =
      applied.conditions.seatingKnown === false
        ? " Seats were not declared — confirm them before treating this as seated service."
        : "";
    setArchitectureNote(
      locked
        ? `Received from Compose at ${new Date(applied.savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. ${applied.label}. ${applied.thesis} The selected dishes stay locked.${seatNote}`
        : `Compose applied: ${applied.label}. ${applied.thesis || "Rebuild the route to sequence the night."}${seatNote}`,
    );
  }, []);

  // Venue Intelligence → Plan handoff (session or #vo= hash).
  useEffect(() => {
    const applied = takeVenueApply();
    if (!applied) return;
    setConditions(applied.conditions);
    setPhase("evaluated");
    setCommittedSig(null);
    const seatNote =
      applied.conditions.seatingKnown === false
        ? " Seats were not declared at the venue — confirm them before treating this as seated service."
        : "";
    const residual =
      applied.residuals.length > 0
        ? ` Open residuals: ${applied.residuals.slice(0, 4).join("; ")}${applied.residuals.length > 4 ? "…" : ""}.`
        : "";
    setVenueNote(
      `Received from Venue Intelligence · ${applied.venue.name}${applied.venue.region ? ` (${applied.venue.region})` : ""}. ${applied.thesis}${seatNote}${residual}`,
    );
  }, []);

  const library = useMemo(() => {
    const base = filterByCuisine(all, conditions.cuisines ?? []);
    if (!overlayDishes.length) return base;
    const byId = new Map(base.map((d) => [d.id, d] as const));
    for (const d of overlayDishes) byId.set(d.id, normalise(d));
    return [...byId.values()];
  }, [all, conditions.cuisines, overlayDishes]);

  const plan = useMemo(() => buildPlan(conditions, library), [conditions, library]);
  const stale = committedSig !== null && committedSig !== plan.signature;
  const visible = phase !== "draft";
  const committed = phase === "committed";

  const saveVariant = () =>
    setVariants((v) =>
      [...v, { id: `${Date.now()}`, label: conditions.label || plan.signature, plan }].slice(-3),
    );

  return (
    <div className="min-h-dvh">
      <HostChrome showPrint />
      {architectureNote && (
        <div role="status" className="no-print border-b border-border bg-secondary">
          <div className="mx-auto max-w-6xl px-5 py-3 text-sm leading-relaxed">
            <span className="rule-label">Compose → Discover</span>
            <p className="mt-1">{architectureNote}</p>
          </div>
        </div>
      )}
      {venueNote && (
        <div role="status" className="no-print border-b border-border bg-secondary">
          <div className="mx-auto max-w-6xl px-5 py-3 text-sm leading-relaxed">
            <span className="rule-label">Venue Intelligence → Plan</span>
            <p className="mt-1">{venueNote}</p>
          </div>
        </div>
      )}

      {/* Hero — full-bleed tablescape. One headline, one subline, one CTA, one link. */}
      <section className="no-print relative isolate flex min-h-[70vh] items-end bg-ink text-ink-foreground md:min-h-[62vh]">
        <img
          src={HERO_IMAGE}
          alt="A formally set dinner table: black plates, gold cutlery, white roses and lit candles"
          width={1800}
          height={1028}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-60"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20"
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-28 sm:pb-24">
          <h1 className="max-w-3xl font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
            Plan the night you can actually host
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
            Guests, seats, ovens and hours go in. A route you can run comes out.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a
              href="#work"
              className="bg-accent px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] text-accent-foreground transition-opacity hover:opacity-90"
            >
              Start planning
            </a>
            <a
              href="#starts"
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-foreground underline underline-offset-8 hover:text-accent"
            >
              Open a starting point
            </a>
          </div>
        </div>
      </section>

      <section id="starts" className="no-print border-b border-border bg-secondary">
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
                setPhase("evaluated");
              }}
            />
          </div>
        </div>
      </section>

      <main id="work" className="mx-auto max-w-6xl px-5 py-12">
        <div className="no-print grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
          <div className="lg:sticky lg:top-20">
            <ConditionsPanel
              value={conditions}
              onChange={(next) => {
                setConditions(next);
                if (phase === "committed") setPhase("evaluated");
              }}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPhase("evaluated")}
                className="flex-1 bg-foreground px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90"
              >
                {visible ? "Re-evaluate" : "Evaluate"}
              </button>
              <button
                type="button"
                disabled={!visible}
                onClick={() => {
                  setPhase("committed");
                  setCommittedSig(plan.signature);
                }}
                className="flex-1 border border-foreground px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
              >
                Commit plan
              </button>
              <button
                type="button"
                onClick={() => {
                  setConditions(DEFAULT_CONDITIONS);
                  setPhase("draft");
                  setCommittedSig(null);
                }}
                className="border border-border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                {t("work.reset")}
              </button>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {phase === "draft" && "Set the conditions, then evaluate."}
              {phase === "evaluated" && "Review the route, then commit to freeze it."}
              {phase === "committed" &&
                (stale ? "This plan is out of date. Re-evaluate to refresh." : "Committed and frozen until you rebuild.")}
            </p>
          </div>

          <div>
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <div>
                <span className="rule-label">{t("work.section02")}</span>
                <h2 className="mt-1 text-2xl tracking-tight">{t("work.route")}</h2>
              </div>
              {visible && (
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

            {visible ? (
              <>
                <p role="status" aria-live="polite" className="sr-only">
                  {plan.stops.length ? t("work.stopsPresent") : t("work.rebuilt")}
                </p>
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
                      [t("work.step1"), t("work.step1"), t("work.step1.body")],
                      [t("work.step2"), t("work.step2"), t("work.step2.body")],
                      [t("work.step3"), t("work.step3"), t("work.step3.body")],
                    ].map(([n, title, body]) => (
                      <li key={title} className="border-t border-accent pt-3">
                        <p className="text-sm font-medium">{title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{body}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-10 max-w-3xl border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          {t("hero.boundary.body")}
        </p>

        <div className="mt-16">
          <HostContract plan={plan} evaluated={visible} />
        </div>

        <div className="mt-16">
          <RunConsole
            conditions={conditions}
            library={library}
            stale={stale}
            committed={committed}
            onCommit={(p) => {
              setPhase("committed");
              setCommittedSig(p.signature);
            }}
            onRestore={(c) => {
              setConditions(c);
              setPhase("evaluated");
            }}
          />
        </div>

        {visible && (
          <div className="mt-16 space-y-16">
            <DecisionPacket plan={plan} library={library} />
            <ServiceRunner plan={plan} />
          </div>
        )}

        {visible && variants.length > 0 && (
          <section className="no-print mt-16">
            <span className="rule-label">{t("work.section03")}</span>
            <h2 className="mt-1 text-2xl tracking-tight">{t("work.variations")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("work.variations.body")}</p>
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
                          <span className="font-mono text-[10px] text-muted-foreground">{v.plan.signature}</span>
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

        {visible && (
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
                      await planPdf(plan, styleForTheme(cvd ? "cvd" : theme), config.printLayout);
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

      <LabsFooter />
    </div>
  );
}
