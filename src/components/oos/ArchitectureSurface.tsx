import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { evaluateMenuBuilder, rescoreAgainstLockedAnchor } from "@/lib/architecture/evaluate";
import { buildMenuBuilderExpansion } from "@/lib/architecture/expansion";
import { roleLabel, titleCase } from "@/lib/architecture/labels";
import {
  DEFAULT_INPUT,
  OCCASION_OPTIONS,
  SCENARIOS,
  type MenuBuilderInput,
  type MenuBuilderResult,
  type ScenarioPreset,
} from "@/lib/architecture/types";
import {
  buildApplyPayload,
  decodeProposalToken,
  encodeProposalToken,
  proposalShareUrl,
  stashApply,
  stashProposal,
} from "@/lib/architecture/apply";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const field =
  "mt-2 w-full border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const btn =
  "min-h-11 border border-border bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground disabled:opacity-40";
const btnPrimary =
  "min-h-11 border border-foreground bg-foreground px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-background transition-opacity hover:opacity-85 disabled:opacity-40";

function guestBandFromCount(n: number): string {
  if (n < 12) return "under_12";
  if (n <= 24) return "12_24";
  if (n <= 50) return "25_50";
  return "over_50";
}

function bandClass(band: string) {
  if (band === "strong") return "text-signal-controlled";
  if (band === "workable") return "text-signal-tight";
  return "text-signal-over";
}

export function ArchitectureSurface({ initialToken = null }: { initialToken?: string | null }) {
  const { t } = useT();
  const navigate = useNavigate();
  const [input, setInput] = useState<MenuBuilderInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<MenuBuilderResult | null>(null);
  const [status, setStatus] = useState<string>(t("arch.status.idle"));
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [linkMsg, setLinkMsg] = useState<string | null>(null);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!initialToken) return;
    const decoded = decodeProposalToken(initialToken);
    if (decoded?.conditions) {
      setStatus(t("arch.status.loadedProposal"));
      setApplyMsg(
        `${decoded.label}${decoded.thesis ? ` — ${decoded.thesis}` : ""}. ${t("arch.apply.ready")}`,
      );
      // Prefill guests/label from proposal conditions
      setInput((prev) => ({
        ...prev,
        occasion: decoded.label || prev.occasion,
        guestCount: decoded.conditions.guests,
        guestBand: guestBandFromCount(decoded.conditions.guests),
      }));
    }
  }, [initialToken, t]);

  const patch = (partial: Partial<MenuBuilderInput>) => {
    setInput((prev) => {
      const next = { ...prev, ...partial };
      if (partial.guestCount !== undefined) {
        next.guestBand = guestBandFromCount(Number(partial.guestCount));
      }
      return next;
    });
    setActiveScenario(null);
  };

  const loadScenario = (s: ScenarioPreset) => {
    setInput({ ...DEFAULT_INPUT, ...s.input } as MenuBuilderInput);
    setActiveScenario(s.id);
    setResult(null);
    setStatus(t("arch.status.scenarioLoaded"));
  };

  const runBuild = (lockId?: string | null) => {
    const payload: MenuBuilderInput = {
      ...input,
      guestBand: guestBandFromCount(Number(input.guestCount)),
      lockedAnchorId: lockId === undefined ? input.lockedAnchorId : lockId,
    };
    const raw = payload.lockedAnchorId
      ? rescoreAgainstLockedAnchor(payload, payload.lockedAnchorId)
      : evaluateMenuBuilder(payload);
    const out = raw as MenuBuilderResult;
    const expansion = buildMenuBuilderExpansion(payload, out);
    const withExp: MenuBuilderResult = { ...out, expansion };
    setResult(withExp);
    setInput(payload);
    if (out.status === "invalid") {
      setStatus((out.errors || []).join(" · ") || t("arch.status.invalid"));
    } else if (expansion.hardStops?.length) {
      setStatus(t("arch.status.hardStops"));
    } else {
      setStatus(t("arch.status.ready"));
    }
  };

  const hardStops = result?.expansion?.hardStops ?? [];
  const stress = result?.menuStressTest;
  const dishPlan = result?.dishPlan ?? [];

  const canApply = useMemo(() => {
    if (!result) return false;
    if (result.status === "invalid") return false;
    if (hardStops.length) return false;
    return true;
  }, [result, hardStops.length]);

  const applyToPlan = () => {
    if (!result) return;
    const built = buildApplyPayload(input, result);
    if (!built.ok) {
      setApplyMsg(built.errors.join(" · "));
      return;
    }
    stashApply(built.payload);
    stashProposal(built.payload);
    setApplyMsg(t("arch.apply.stashed"));
    navigate({ to: "/" });
  };

  const copyLink = async () => {
    if (!result) return;
    const built = buildApplyPayload(input, result);
    if (!built.ok) {
      // still allow sharing roles/thesis without full handoff
      const soft = {
        savedAt: new Date().toISOString(),
        label: input.occasion,
        thesis: String(result.thesis || ""),
        conditions: {
          ...requireConditionsStub(input),
        },
        roles: result.roles as Record<string, string> | undefined,
        handoff: null,
      };
      const token = encodeProposalToken(soft as any);
      const url = proposalShareUrl(token);
      try {
        await navigator.clipboard.writeText(url);
        setLinkMsg(t("arch.link.copied"));
      } catch {
        setLinkMsg(url);
      }
      return;
    }
    stashProposal(built.payload);
    const token = encodeProposalToken(built.payload);
    const url = proposalShareUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      setLinkMsg(t("arch.link.copied"));
    } catch {
      setLinkMsg(url);
    }
  };

  const toggleConstraint = (key: "equipmentConstraints" | "dietaryCategories" | "declaredAllergens", value: string) => {
    setInput((prev) => {
      const set = new Set(prev[key] || []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, [key]: [...set] };
    });
    setActiveScenario(null);
  };

  return (
    <div className="space-y-12">
      {/* Scenarios */}
      <section>
        <span className="rule-label">{t("arch.scenarios.eyebrow")}</span>
        <h2 className="mt-1 text-2xl tracking-tight">{t("arch.scenarios.title")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("arch.scenarios.body")}
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadScenario(s)}
              className={cn(
                "border px-4 py-3 text-left transition-colors",
                activeScenario === s.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/40",
              )}
            >
              <p className="font-display text-base tracking-tight">{s.name}</p>
              <p
                className={cn(
                  "mt-1 text-xs leading-relaxed",
                  activeScenario === s.id ? "text-background/80" : "text-muted-foreground",
                )}
              >
                {s.blurb}
              </p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* Inputs */}
        <section className="space-y-6">
          <div>
            <span className="rule-label">{t("arch.inputs.eyebrow")}</span>
            <h2 className="mt-1 text-2xl tracking-tight">{t("arch.inputs.title")}</h2>
          </div>

          <label className="block">
            <span className="rule-label">{t("arch.field.occasion")}</span>
            <select
              className={field}
              value={input.occasion}
              onChange={(e) => patch({ occasion: e.target.value })}
            >
              {OCCASION_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="rule-label">{t("arch.field.guests")}</span>
              <input
                type="number"
                min={1}
                max={120}
                className={field}
                value={input.guestCount}
                onChange={(e) => patch({ guestCount: Number(e.target.value) || 1 })}
              />
            </label>
            <label className="block">
              <span className="rule-label">{t("arch.field.service")}</span>
              <select
                className={field}
                value={input.serviceStyle}
                onChange={(e) => patch({ serviceStyle: e.target.value })}
              >
                <option value="family_style">Family style</option>
                <option value="plated">Plated</option>
                <option value="buffet">Buffet</option>
                <option value="grazing">Grazing</option>
              </select>
            </label>
            <label className="block">
              <span className="rule-label">{t("arch.field.attention")}</span>
              <select
                className={field}
                value={input.attentionBand}
                onChange={(e) => patch({ attentionBand: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="block">
              <span className="rule-label">{t("arch.field.arc")}</span>
              <select
                className={field}
                value={input.menuArc}
                onChange={(e) => patch({ menuArc: e.target.value })}
              >
                <option value="relaxed">Relaxed</option>
                <option value="bright_light">Bright / light</option>
                <option value="rich_comforting">Rich / comforting</option>
                <option value="seasonal">Seasonal</option>
                <option value="celebratory">Celebratory</option>
              </select>
            </label>
            <label className="block">
              <span className="rule-label">{t("arch.field.prep")}</span>
              <select
                className={field}
                value={input.prepCapacity}
                onChange={(e) => patch({ prepCapacity: e.target.value })}
              >
                <option value="limited">Limited</option>
                <option value="standard">Standard</option>
                <option value="generous">Generous</option>
              </select>
            </label>
            <label className="block">
              <span className="rule-label">{t("arch.field.kitchen")}</span>
              <select
                className={field}
                value={input.kitchenCapacity}
                onChange={(e) => patch({ kitchenCapacity: e.target.value })}
              >
                <option value="limited">Limited</option>
                <option value="standard">Standard</option>
                <option value="generous">Generous</option>
              </select>
            </label>
          </div>

          <div>
            <span className="rule-label">{t("arch.field.equipment")}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["limited_oven", "Limited oven"],
                ["limited_burners", "Limited burners"],
                ["limited_refrigeration", "Limited cold"],
              ].map(([v, label]) => {
                const on = (input.equipmentConstraints || []).includes(v!);
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleConstraint("equipmentConstraints", v!)}
                    className={cn(
                      "border px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest",
                      on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="rule-label">{t("arch.field.dietary")}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {["vegetarian", "vegan", "gluten-aware", "dairy-aware"].map((v) => {
                const on = (input.dietaryCategories || []).includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleConstraint("dietaryCategories", v)}
                    className={cn(
                      "border px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest",
                      on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground",
                    )}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-3 border border-border bg-card px-3 py-3">
            <input
              type="checkbox"
              checked={input.budgetPressure}
              onChange={(e) => patch({ budgetPressure: e.target.checked })}
              className="size-4"
            />
            <span className="text-sm">{t("arch.field.budget")}</span>
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={() => runBuild()}>
              {t("arch.action.build")}
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => {
                setInput(DEFAULT_INPUT);
                setResult(null);
                setActiveScenario(null);
                setStatus(t("arch.status.idle"));
              }}
            >
              {t("arch.action.reset")}
            </button>
          </div>
          <p role="status" className="border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
            {status}
          </p>
        </section>

        {/* Result */}
        <section className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div>
            <span className="rule-label">{t("arch.result.eyebrow")}</span>
            <h2 className="mt-1 text-2xl tracking-tight">{t("arch.result.title")}</h2>
          </div>

          {!result && (
            <p className="border border-border bg-card px-5 py-8 text-sm leading-relaxed text-muted-foreground">
              {t("arch.result.empty")}
            </p>
          )}

          {result && result.status !== "invalid" && (
            <div className="space-y-5">
              <div className="paper border border-border p-5">
                <span className="rule-label text-brass">{t("arch.result.thesis")}</span>
                <p className="mt-2 font-display text-xl leading-snug tracking-tight">{result.thesis}</p>
                {result.serviceLogic && (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{result.serviceLogic}</p>
                )}
              </div>

              {stress && (
                <div className="border border-border bg-card p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="rule-label">{t("arch.result.stress")}</span>
                    <span className={cn("font-mono text-sm uppercase tracking-widest", bandClass(String(stress.band)))}>
                      {stress.band} · {stress.score}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{stress.verdict}</p>
                  <ul className="mt-4 space-y-2">
                    {Object.entries(stress.dimensions || {}).map(([dim, score]) => (
                      <li key={dim}>
                        <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          <span>{titleCase(dim.replace(/_/g, " "))}</span>
                          <span>{score}</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-muted">
                          <div
                            className="h-full bg-brass"
                            style={{ width: `${Math.max(4, Math.min(100, Number(score)))}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {dishPlan.length > 0 && (
                <div className="border border-border bg-card">
                  <div className="border-b border-border px-5 py-3">
                    <span className="rule-label">{t("arch.result.roles")}</span>
                  </div>
                  <ul className="divide-y divide-border">
                    {dishPlan.map((block) => (
                      <li key={block.role} className="px-5 py-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-brass">
                          {roleLabel(block.role)}
                        </p>
                        {block.primary ? (
                          <>
                            <p className="mt-1 text-sm font-medium">{block.primary.name}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {block.primary.blurb}
                            </p>
                            <button
                              type="button"
                              className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                              onClick={() => runBuild(block.primary!.id)}
                            >
                              {t("arch.action.lockAnchor")}
                            </button>
                          </>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">—</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hardStops.length > 0 && (
                <div className="border border-signal-over bg-card px-5 py-4">
                  <span className="rule-label text-signal-over">{t("arch.result.hardStops")}</span>
                  <ul className="mt-2 space-y-2 text-sm">
                    {hardStops.map((h: { code: string; message: string; nextAction: string }) => (
                      <li key={h.code}>
                        <p>{h.message}</p>
                        <p className="text-xs text-muted-foreground">{h.nextAction}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(result.simplifyFirst?.length ?? 0) > 0 && (
                <div className="border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
                  <span className="rule-label">{t("arch.result.simplify")}</span>
                  <ul className="mt-1 list-disc pl-4">
                    {result.simplifyFirst!.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnPrimary} disabled={!canApply} onClick={applyToPlan}>
                  {t("arch.action.apply")}
                </button>
                <button type="button" className={btn} onClick={copyLink} disabled={!result}>
                  {t("arch.action.link")}
                </button>
                <a
                  href="https://occasion.saltnotes.blog/architecture"
                  target="_blank"
                  rel="noreferrer noopener"
                  className={cn(btn, "inline-flex items-center")}
                >
                  {t("arch.action.standalone")}
                </a>
              </div>
              {applyMsg && (
                <p role="status" className="border-l-2 border-accent pl-3 text-xs">
                  {applyMsg}
                </p>
              )}
              {linkMsg && (
                <p role="status" className="break-all border-l-2 border-accent pl-3 font-mono text-[10px]">
                  {linkMsg}
                </p>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">{t("arch.boundary")}</p>
            </div>
          )}

          {result?.status === "invalid" && (
            <div className="border border-signal-over px-5 py-4 text-sm">
              {(result.errors || []).map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** Minimal conditions stub for soft proposal links when handoff is blocked. */
function requireConditionsStub(input: MenuBuilderInput) {
  return {
    label: input.occasion,
    shape: "dinner" as const,
    style: "seated" as const,
    guests: Number(input.guestCount) || 8,
    helpers: 1,
    serviceTime: "19:00",
    prepWindowH: 5,
    ambition: 2 as const,
    diets: [] as const,
    season: "winter" as const,
    budgetTier: 2 as const,
    kids: false,
    outdoor: false,
    leftovers: "some" as const,
    kitchen: {
      ovens: 1,
      burners: 4,
      grill: false,
      dishwasher: true,
      fridge: "normal" as const,
      counter: "medium" as const,
      seats: Number(input.guestCount) || 8,
    },
  };
}
