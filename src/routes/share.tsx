import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PlanSurface } from "@/components/oos/PlanSurface";
import { HostPacket } from "@/components/oos/HostPacket";
import { ThemeToggle } from "@/components/oos/ThemeToggle";
import { LanguageToggle } from "@/components/oos/LanguageToggle";
import { buildPlan, DEFAULT_CONDITIONS } from "@/lib/oos/engine";
import { normalise, resolveLibrary } from "@/lib/oos/library";
import { decodeShare, type SharePayload } from "@/lib/oos/share";
import { saveScenario, useConfig } from "@/lib/oos/store";
import type { Conditions, Dish } from "@/lib/oos/types";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/share")({
  head: () => ({
    meta: [
      { title: "Shared plan — Occasion Operating System" },
      {
        name: "description",
        content:
          "A read-only host plan rebuilt from the link itself: menu, load gauges, prep clock, service sequence and shopping list. Nothing is uploaded.",
      },
      { property: "og:title", content: "Shared plan — Occasion Operating System" },
      {
        property: "og:description",
        content: "A read-only host plan: menu, load, prep clock and shopping list, carried inside the link.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharePage,
});

type State = { status: "loading" } | { status: "bad" } | { status: "ok"; payload: SharePayload };

function SharePage() {
  const { t } = useT();
  const config = useConfig();
  const [state, setState] = useState<State>({ status: "loading" });
  const [adopted, setAdopted] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("p");
    if (!token) {
      setState({ status: "bad" });
      return;
    }
    let live = true;
    decodeShare(token).then((payload) => {
      if (!live) return;
      setState(payload ? { status: "ok", payload } : { status: "bad" });
    });
    return () => {
      live = false;
    };
  }, []);

  const plan = useMemo(() => {
    if (state.status !== "ok") return null;
    const conditions = { ...DEFAULT_CONDITIONS, ...state.payload.c } as Conditions;
    // The recipient's own workshop is never written to; shared dishes are merged read-only.
    const base = resolveLibrary(config);
    const extra = (state.payload.d ?? []).map((d) => normalise(d as Dish));
    const byId = new Map(base.map((d) => [d.id, d] as const));
    for (const d of extra) byId.set(d.id, d);
    try {
      return buildPlan(conditions, [...byId.values()]);
    } catch {
      return null;
    }
  }, [state, config]);

  return (
    <div className="min-h-dvh">
      <header className="no-print sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="font-display text-lg tracking-tight">{t("app.name")}</span>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              to="/"
              className="min-h-11 font-mono text-[11px] uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("share.open")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12">
        <span className="rule-label">{t("share.eyebrow")}</span>
        <h1 className="mt-1 font-display text-4xl tracking-tight">{t("share.title")}</h1>

        {state.status === "loading" && (
          <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
            {t("share.loading")}
          </p>
        )}

        {(state.status === "bad" || (state.status === "ok" && !plan)) && (
          <div className="mt-6 max-w-xl border-l-2 border-signal-over pl-4">
            <h2 className="text-xl tracking-tight">{t("share.bad.title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("share.bad.body")}</p>
            <Link
              to="/"
              className="mt-5 inline-flex min-h-11 items-center border border-foreground px-4 py-2 font-mono text-[11px] uppercase tracking-widest hover:bg-foreground hover:text-background"
            >
              {t("share.open")}
            </Link>
          </div>
        )}

        {state.status === "ok" && plan && (
          <>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("share.body")}</p>
            <div className="no-print mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  saveScenario(
                    plan.conditions.label || "Shared plan",
                    plan.signature,
                    plan.conditions,
                    state.payload.k ?? "",
                  );
                  setAdopted(true);
                }}
                className="min-h-11 bg-foreground px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-background"
              >
                {t("share.adopt")}
              </button>
              {adopted && (
                <span role="status" className="text-sm text-muted-foreground">
                  {t("share.adopted")}
                </span>
              )}
            </div>

            <div className="mt-10">
              <PlanSurface plan={plan} />
            </div>

            <div className="mt-14">
              <HostPacket plan={plan} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
