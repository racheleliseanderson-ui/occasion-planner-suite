import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { evaluateMenuBuilder } from "@/lib/architecture/evaluate";
import { buildMenuBuilderExpansion } from "@/lib/architecture/expansion";
import { roleLabel, titleCase } from "@/lib/architecture/labels";
import {
  APP_VERSION,
  DEFAULT_INPUT,
  OCCASION_OPTIONS,
  SCENARIOS,
  type DishPlanBlock,
  type HistoryEntry,
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
  type ArchitectureApplyPayload,
} from "@/lib/architecture/apply";
import {
  clearSavedInput,
  loadHistory,
  loadSavedInput,
  removeHistoryEntry,
  saveHistoryEntry,
  saveInput,
} from "@/lib/architecture/persistence";
import { buildServicePlan, stashPlan } from "@/lib/architecture/plan";
import { downloadText, cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { DishPlan } from "./DishPlan";
import { StressMeters } from "./StressMeters";

const field =
  "mt-2 w-full border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const btn =
  "min-h-11 border border-border bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground disabled:opacity-40";
const btnPrimary =
  "min-h-11 border border-foreground bg-foreground px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-background transition-opacity hover:opacity-85 disabled:opacity-40";
const check =
  "flex min-h-11 items-center gap-2.5 border border-border bg-card px-3 py-2 text-sm hover:border-foreground/40";

function guestBandFromCount(n: number): string {
  if (n < 12) return "under_12";
  if (n <= 24) return "12_24";
  if (n <= 50) return "25_50";
  return "over_50";
}

function mapDishPlan(raw: unknown): DishPlanBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((block: DishPlanBlock) => ({
    role: String(block.role),
    primary: block.primary
      ? {
          id: block.primary.id,
          name: block.primary.name,
          blurb: block.primary.blurb,
          why: block.primary.why,
          makeAhead: Boolean(block.primary.makeAhead),
          heat: block.primary.heat,
          richness: block.primary.richness,
          texture: block.primary.texture,
          flavorFamilies: block.primary.flavorFamilies || [],
          score: block.primary.score,
          fitReasons: block.primary.fitReasons || [],
        }
      : null,
    alternatives: (block.alternatives || []).map((a) => ({
      id: a.id,
      name: a.name,
      blurb: a.blurb,
      makeAhead: Boolean(a.makeAhead),
      heat: a.heat,
      score: a.score,
      fitReasons: a.fitReasons || [],
      flavorFamilies: a.flavorFamilies || [],
    })),
  }));
}

export function ArchitectureSurface({ initialToken = null }: { initialToken?: string | null }) {
  const { t } = useT();
  const navigate = useNavigate();
  const resultRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState<MenuBuilderInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<MenuBuilderResult | null>(null);
  const [status, setStatus] = useState<string>(t("arch.status.idle"));
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [linkMsg, setLinkMsg] = useState<string | null>(null);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);
  const [review, setReview] = useState<ArchitectureApplyPayload | null>(null);
  const [step, setStep] = useState(1);
  const [resultStage, setResultStage] = useState<"architecture" | "stress" | "service" | "packet">(
    "architecture",
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = loadSavedInput();
      if (saved) {
        setInput({ ...DEFAULT_INPUT, ...saved });
        setStatus("Locally saved Architecture inputs restored.");
      }
      setHistory(loadHistory());
    } catch {
      setStatus("Local storage unavailable. Continuing without saved inputs.");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!initialToken) return;
    const decoded = decodeProposalToken(initialToken);
    if (decoded?.conditions) {
      setStatus(t("arch.status.loadedProposal"));
      setApplyMsg(
        `${decoded.label}${decoded.thesis ? ` — ${decoded.thesis}` : ""}. ${t("arch.apply.ready")}`,
      );
      setInput((prev) => ({
        ...prev,
        occasion: decoded.label || prev.occasion,
        guestCount: decoded.conditions.guests,
        guestBand: guestBandFromCount(decoded.conditions.guests),
        seatingKnown: decoded.conditions.seatingKnown,
        seatingCount: decoded.conditions.seatingKnown ? decoded.conditions.kitchen.seats : null,
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

  const toggleList = (
    key: "dietaryCategories" | "declaredAllergens" | "equipmentConstraints",
    value: string,
  ) => {
    setInput((prev) => {
      const set = new Set(prev[key] || []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, [key]: [...set] };
    });
    setActiveScenario(null);
  };

  const runBuild = useCallback(
    (nextInput: MenuBuilderInput, opts?: { fromLock?: boolean }) => {
      const payload: MenuBuilderInput = {
        ...nextInput,
        guestBand: guestBandFromCount(Number(nextInput.guestCount)),
        cuisine: nextInput.cuisine || "any",
      };
      const out = evaluateMenuBuilder(payload) as MenuBuilderResult;
      if (out.dishPlan) out.dishPlan = mapDishPlan(out.dishPlan);
      const expansion = out.status === "invalid" ? undefined : buildMenuBuilderExpansion(payload, out);
      const withExp: MenuBuilderResult = { ...out, expansion };
      setResult(withExp);
      setInput(payload);
      saveInput(payload);
      if (out.status !== "invalid") {
        stashPlan({
          savedAt: new Date().toISOString(),
          scenarioId: activeScenario,
          input: payload,
          result: withExp,
        });
      }
      if (out.status === "invalid") {
        setStatus((out.errors || []).join(" · ") || t("arch.status.invalid"));
      } else if (expansion?.hardStops?.length) {
        setStatus(t("arch.status.hardStops"));
        setResultStage("packet");
      } else {
        setStatus(
          opts?.fromLock
            ? `Anchor locked to ${payload.lockedAnchorId}. Supporting dishes re-scored under ${out.pairingMode || "balanced"} mode.`
            : t("arch.status.ready"),
        );
        setResultStage(opts?.fromLock ? "architecture" : "architecture");
        if (!opts?.fromLock) {
          saveHistoryEntry({
            id: `${Date.now()}-${(payload.occasion || "plan").slice(0, 24)}`,
            label: `${payload.occasion || "Plan"} · ${payload.guestCount || "?"} guests`,
            thesis: out.thesis || "",
            band: out.menuStressTest?.band || out.confidence?.band || "",
            score: out.menuStressTest?.score || out.confidence?.score || 0,
            savedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
            input: { ...payload },
          });
          setHistory(loadHistory());
        }
      }
      queueMicrotask(() => {
        resultRef.current?.focus();
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [activeScenario, t],
  );

  const loadScenario = (s: ScenarioPreset) => {
    const next = { ...DEFAULT_INPUT, ...s.input } as MenuBuilderInput;
    setInput(next);
    setActiveScenario(s.id);
    setStep(1);
    setReview(null);
    runBuild(next);
  };

  const onLockAnchor = (id: string) => {
    if (!result || result.status === "invalid") return;
    runBuild({ ...input, lockedAnchorId: id }, { fromLock: true });
  };

  const hardStops = result?.expansion?.hardStops ?? [];
  const canApply = useMemo(() => {
    if (!result || result.status === "invalid") return false;
    if (hardStops.length) return false;
    return true;
  }, [result, hardStops.length]);

  const service = useMemo(
    () => (result && result.status !== "invalid" ? buildServicePlan(input, result) : null),
    [input, result],
  );

  const applyToPlan = () => {
    if (!result) return;
    const built = buildApplyPayload(input, result);
    if (!built.ok) {
      setApplyMsg(built.errors.join(" · "));
      setResultStage("packet");
      return;
    }
    setReview(built.payload);
    setApplyMsg(null);
    setResultStage("packet");
  };

  const confirmApply = () => {
    if (!review) return;
    stashApply(review);
    stashProposal(review);
    setApplyMsg(t("arch.apply.stashed"));
    navigate({ to: "/" });
  };

  const copyLink = async () => {
    if (!result) return;
    const built = buildApplyPayload(input, result);
    if (!built.ok) {
      const soft = {
        savedAt: new Date().toISOString(),
        label: input.occasion,
        thesis: String(result.thesis || ""),
        conditions: requireConditionsStub(input),
        roles: result.roles as Record<string, string> | undefined,
        handoff: null,
        overlayDishes: [],
        review: { moving: [], notMoving: [], needsConfirmation: [] },
      };
      const token = encodeProposalToken(soft as ArchitectureApplyPayload);
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

  const onDownload = () => {
    if (!result) return;
    downloadText(
      "occasion-architecture-plan.json",
      `${JSON.stringify(
        {
          portableFormat: "salty-menu-builder-plan",
          portableFormatVersion: 2,
          exportedAt: new Date().toISOString(),
          applicationVersion: APP_VERSION,
          input,
          result,
        },
        null,
        2,
      )}\n`,
      "application/json",
    );
    setStatus("Planning record downloaded as JSON. Nothing was uploaded.");
  };

  const onReset = () => {
    clearSavedInput();
    setInput(DEFAULT_INPUT);
    setResult(null);
    setActiveScenario(null);
    setReview(null);
    setStep(1);
    setResultStage("architecture");
    setStatus(t("arch.status.idle"));
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[32vh] flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="font-display text-xl">Restoring Architecture…</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Local inputs stay in this browser. The form opens even if storage is blocked.
        </p>
      </div>
    );
  }

  const validResult = result && result.status !== "invalid";

  return (
    <div className="space-y-12">
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

      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <section className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div>
            <span className="rule-label">{t("arch.inputs.eyebrow")}</span>
            <h2 className="mt-1 text-2xl tracking-tight">{t("arch.inputs.title")}</h2>
          </div>

          <div className="flex gap-1" role="tablist" aria-label="Input steps">
            {[
              { id: 1, label: "Occasion" },
              { id: 2, label: "Capacity" },
              { id: 3, label: "Direction" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={step === s.id}
                className={cn(
                  "min-h-11 flex-1 px-2 py-2 font-mono text-[10px] uppercase tracking-widest",
                  step === s.id
                    ? "bg-foreground text-background"
                    : "border border-border text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setStep(s.id)}
              >
                {s.id}. {s.label}
              </button>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <label className="block">
                  <span className="rule-label">{t("arch.field.guests")}</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
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
              </div>
              <label className={check}>
                <input
                  type="checkbox"
                  checked={input.seatingKnown === true}
                  onChange={(e) =>
                    patch({
                      seatingKnown: e.target.checked,
                      seatingCount: e.target.checked ? input.seatingCount ?? input.guestCount : null,
                    })
                  }
                  className="size-4"
                />
                <span>{t("arch.field.seatsKnown")}</span>
              </label>
              <label className="block">
                <span className="rule-label">{t("arch.field.seats")}</span>
                <input
                  type="number"
                  min={0}
                  max={120}
                  disabled={input.seatingKnown !== true}
                  className={field}
                  value={input.seatingKnown === true ? Number(input.seatingCount ?? 0) : ""}
                  placeholder={t("arch.field.seatsUnknown")}
                  onChange={(e) => patch({ seatingCount: Number(e.target.value) || 0, seatingKnown: true })}
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block">
                <span className="rule-label">{t("arch.field.eventDay")}</span>
                <select
                  className={field}
                  value={input.eventDayTime}
                  onChange={(e) => patch({ eventDayTime: e.target.value })}
                >
                  <option value="low">Very limited</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">Generous</option>
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
              <div>
                <span className="rule-label">{t("arch.field.equipment")}</span>
                <div className="mt-2 grid gap-2">
                  {[
                    ["limited_oven", "Limited oven — one remains"],
                    ["limited_burners", "Limited burners — two remain"],
                    ["limited_refrigeration", "Limited refrigeration"],
                    ["no_oven", "No oven — not a limited one"],
                  ].map(([v, label]) => {
                    const on = (input.equipmentConstraints || []).includes(v!);
                    return (
                      <label key={v} className={check}>
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={on}
                          onChange={() => toggleList("equipmentConstraints", v!)}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
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
                <span className="rule-label">{t("arch.field.beverage")}</span>
                <select
                  className={field}
                  value={input.beverageRoute}
                  onChange={(e) => patch({ beverageRoute: e.target.value })}
                >
                  <option value="both">One drink + one no-drink</option>
                  <option value="zero_proof">Zero-proof primary</option>
                  <option value="alcoholic">Alcoholic + equal zero-proof</option>
                </select>
              </label>
              <div>
                <span className="rule-label">{t("arch.field.dietary")}</span>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {["vegetarian", "vegan", "gluten-aware", "dairy-aware"].map((v) => (
                    <label key={v} className={check}>
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={(input.dietaryCategories || []).includes(v)}
                        onChange={() => toggleList("dietaryCategories", v)}
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <span className="rule-label">{t("arch.field.allergens")}</span>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t("arch.field.allergens.note")}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {["egg", "gluten", "milk", "tree-nut", "shellfish", "peanut", "sesame"].map((v) => (
                    <label key={v} className={check}>
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={(input.declaredAllergens || []).includes(v)}
                        onChange={() => toggleList("declaredAllergens", v)}
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              <label className={check}>
                <input
                  type="checkbox"
                  checked={input.budgetPressure}
                  onChange={(e) => patch({ budgetPressure: e.target.checked })}
                  className="size-4"
                />
                <span>{t("arch.field.budget")}</span>
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {step < 3 ? (
              <button type="button" className={btnPrimary} onClick={() => setStep(step + 1)}>
                Continue
              </button>
            ) : (
              <button type="button" className={btnPrimary} onClick={() => runBuild({ ...input, lockedAnchorId: null })}>
                {t("arch.action.build")}
              </button>
            )}
            {step > 1 ? (
              <button type="button" className={btn} onClick={() => setStep(step - 1)}>
                Back
              </button>
            ) : null}
            <button type="button" className={btn} onClick={onReset}>
              {t("arch.action.reset")}
            </button>
          </div>
          <p role="status" className="border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
            {status}
          </p>

          <div className="border-t border-border pt-4">
            <span className="rule-label">Local plan history</span>
            <p className="mt-1 text-xs text-muted-foreground">
              Up to six recent architectures stay in this browser only.
            </p>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No saved plans yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {history.map((item) => (
                  <li key={item.id} className="border border-border bg-card p-3">
                    <p className="text-sm">{item.label}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {item.band} · {item.score} · {item.savedAt}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={btn}
                        onClick={() => {
                          setInput({ ...DEFAULT_INPUT, ...item.input });
                          setStep(1);
                          setStatus(`Reloaded local plan: ${item.label}. Submit to rebuild architecture.`);
                        }}
                      >
                        Reload
                      </button>
                      <button
                        type="button"
                        className={btn}
                        onClick={() => {
                          removeHistoryEntry(item.id);
                          setHistory(loadHistory());
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div ref={resultRef} tabIndex={-1} className="min-w-0 space-y-6 outline-none" id="menu-builder-result">
          <div>
            <span className="rule-label">{t("arch.result.eyebrow")}</span>
            <h2 className="mt-1 text-2xl tracking-tight">{t("arch.result.title")}</h2>
          </div>

          {!validResult && (
            <div className="border border-border bg-card px-5 py-10 text-center">
              <p className="font-display text-2xl tracking-tight">
                {result?.status === "invalid" ? "Architecture needs more information." : "Your menu logic appears here."}
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                {result?.status === "invalid"
                  ? (result.errors || []).join(" ") || t("arch.status.invalid")
                  : t("arch.result.empty")}
              </p>
            </div>
          )}

          {validResult && (
            <>
              <div
                className="flex flex-wrap gap-1 border border-border p-1"
                role="tablist"
                aria-label="Result stages"
              >
                {(
                  [
                    ["architecture", "Architecture"],
                    ["stress", "Stress"],
                    ["service", "Service plan"],
                    ["packet", "Packet"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={resultStage === id}
                    className={cn(
                      "min-h-11 flex-1 px-3 py-2 font-mono text-[10px] uppercase tracking-widest",
                      resultStage === id
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setResultStage(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <article className="paper border border-border p-5">
                <span className="rule-label text-brass">{titleCase(String(result.status))}</span>
                <p className="mt-2 font-display text-2xl leading-snug tracking-tight">{result.thesis}</p>
                {result.confidence && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    <strong className="text-foreground">Operational confidence:</strong>{" "}
                    {result.confidence.band} ({result.confidence.score}/100). {result.confidence.explanation}
                  </p>
                )}
                {result.serviceLogic && (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{result.serviceLogic}</p>
                )}
                {hardStops.length > 0 && (
                  <div className="mt-4 border border-signal-over px-4 py-3">
                    <span className="rule-label text-signal-over">{t("arch.result.hardStops")}</span>
                    <ul className="mt-2 space-y-2 text-sm">
                      {hardStops.map((h) => (
                        <li key={h.code}>
                          <p>
                            <strong>{h.code}:</strong> {h.message}
                          </p>
                          <p className="text-xs text-muted-foreground">{h.nextAction}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>

              {resultStage === "architecture" && (
                <>
                  {result.roles && (
                    <section className="border border-border bg-card p-5">
                      <span className="rule-label">{t("arch.result.roles")}</span>
                      <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {Object.entries(result.roles).map(([role, value], i) => (
                          <li key={role} className="border border-border px-3 py-3">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-brass">
                              {i + 1}. {roleLabel(role)}
                            </p>
                            <p className="mt-1.5 text-sm">{value}</p>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}
                  {result.dishPlan ? (
                    <DishPlan
                      plan={result.dishPlan}
                      lockedAnchorId={result.lockedAnchorId}
                      pairingMode={result.pairingMode}
                      pairingModeNote={result.pairingModeNote}
                      onLockAnchor={onLockAnchor}
                    />
                  ) : null}
                </>
              )}

              {resultStage === "stress" && (
                <>
                  {result.menuStressTest ? <StressMeters stress={result.menuStressTest} /> : null}
                  <section className="grid gap-4 lg:grid-cols-2">
                    <div className="border border-border bg-card p-5">
                      <h3 className="font-display text-lg">Why this plan looks this way</h3>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {(result.expansion?.explanation || []).map((line) => (
                          <li key={line}>· {line}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="border border-border bg-card p-5">
                      <h3 className="font-display text-lg">Unknowns to verify</h3>
                      {(result.expansion?.unknowns || []).length ? (
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {result.expansion!.unknowns.map((u) => (
                            <li key={u}>· {u}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">
                          No material planning unknown was produced from the declared inputs.
                        </p>
                      )}
                    </div>
                    <div className="border border-border bg-card p-5">
                      <h3 className="font-display text-lg">Conflicts</h3>
                      {(result.expansion?.conflicts || []).length ? (
                        <ol className="mt-3 space-y-3 text-sm">
                          {result.expansion!.conflicts.map((c) => (
                            <li key={c.code} className="border border-border p-3">
                              <p>
                                {c.code}: {c.message}
                              </p>
                              <p className="mt-1 text-muted-foreground">{c.whyItMatters}</p>
                              <p className="mt-1 text-brass">
                                <strong>Next:</strong> {c.nextAction}
                              </p>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">
                          No material operational conflict was produced from the declared inputs.
                        </p>
                      )}
                    </div>
                    <div className="border border-border bg-card p-5">
                      <span className="rule-label">{t("arch.result.simplify")}</span>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {(result.simplifyFirst || []).map((s) => (
                          <li key={s}>· {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="border border-border bg-card p-5">
                      <h3 className="font-display text-lg">Recovery plan</h3>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {(result.recoveryPlan || []).map((s) => (
                          <li key={s}>· {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="border border-border bg-card p-5">
                      <h3 className="font-display text-lg">Beverage direction</h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {result.beverageDirection}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Zero-proof is never a consolation option.
                      </p>
                    </div>
                  </section>
                </>
              )}

              {resultStage === "service" && service && (
                <section className="space-y-5">
                  <div className="paper border border-border p-5">
                    <span className="rule-label">Service plan</span>
                    <h3 className="mt-1 font-display text-2xl tracking-tight">{service.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.thesis}</p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {service.band} · {service.score} · {service.recipeCount} recipes filed
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(
                      [
                        ["Early", service.timeline.early],
                        ["Day before", service.timeline.dayBefore],
                        ["Event day", service.timeline.eventDay],
                        ["Service", service.timeline.service],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="border border-border bg-card p-4">
                        <span className="rule-label">{label}</span>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border border-border bg-card p-5">
                    <span className="rule-label">Service run</span>
                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                      {service.serviceRun.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="border border-border bg-card p-5">
                    <span className="rule-label">Shopping from filed recipes</span>
                    {service.shopping.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">No recipe ingredients filed for this menu.</p>
                    ) : (
                      <div className="mt-4 space-y-5">
                        {service.shopping.map((group) => (
                          <div key={group.aisle}>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-brass">
                              {group.label}
                            </p>
                            <ul className="mt-2 divide-y divide-border border-t border-border">
                              {group.items.map((item) => (
                                <li
                                  key={`${item.item}-${item.dishName}`}
                                  className="flex flex-wrap justify-between gap-3 py-2 text-sm"
                                >
                                  <span>
                                    {item.item}
                                    <span className="ml-2 text-xs text-muted-foreground">{item.dishName}</span>
                                  </span>
                                  <span className="font-mono text-xs text-muted-foreground">{item.amount}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <ul className="divide-y divide-border border border-border bg-card">
                    {service.dishes.map((d) => (
                      <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-3">
                        <div>
                          <span className="rule-label">{d.role}</span>
                          <p className="mt-1">{d.name}</p>
                        </div>
                        {d.hasRecipe ? (
                          <Link
                            to="/recipes/$dishId"
                            params={{ dishId: d.id }}
                            className="font-mono text-[11px] uppercase tracking-widest text-brass underline-offset-4 hover:underline"
                          >
                            Recipe →
                          </Link>
                        ) : (
                          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            No recipe filed
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {resultStage === "packet" && (
                <>
                  <section className="border border-border bg-card p-5">
                    <span className="rule-label">Bounded handoff · Contract 1.2.0</span>
                    <h3 className="mt-1 font-display text-xl">
                      {canApply
                        ? "Packet ready for Plan"
                        : "Packet blocked — hard stop or incomplete contract"}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      Only the public-safe planning contract moves. Guest names, medical history,
                      payment data, prices, and allergy-safety conclusions stay here. Limited equipment
                      stays limited. Unknown seats stay unknown.
                    </p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="border border-signal-controlled/40 p-4">
                        <span className="rule-label text-signal-controlled">Moves</span>
                        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                          <li>· Five-role architecture and selected dishes</li>
                          <li>· Locked anchor and pairing mode</li>
                          <li>· Dietary filters and declared allergen categories</li>
                          <li>· Equipment as limited or none — never invented</li>
                          <li>· Beverage and zero-proof direction</li>
                        </ul>
                      </div>
                      <div className="border border-border p-4">
                        <span className="rule-label">Stays</span>
                        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                          <li>· Draft menus you discarded</li>
                          <li>· Guest names and private notes</li>
                          <li>· Invented seats or extra ovens</li>
                          <li>· Anything you did not explicitly send</li>
                        </ul>
                      </div>
                    </div>
                  </section>
                  {(result.safetyBoundaries || []).length > 0 && (
                    <section className="border border-signal-over/40 bg-card p-5">
                      <h3 className="font-display text-lg text-signal-over">Food-safety and allergen boundary</h3>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {result.safetyBoundaries!.map((s) => (
                          <li key={s}>· {s}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              )}

              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnPrimary} disabled={!canApply} onClick={applyToPlan}>
                  {t("arch.action.apply")}
                </button>
                <button type="button" className={btn} onClick={copyLink} disabled={!result}>
                  {t("arch.action.link")}
                </button>
                <button type="button" className={btn} onClick={onDownload}>
                  Download JSON
                </button>
                <button type="button" className={btn} onClick={() => window.print()}>
                  Print
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
              {review && (
                <div
                  role="dialog"
                  aria-labelledby="handoff-review-title"
                  className="border border-foreground bg-card p-5"
                >
                  <span className="rule-label">{t("arch.review.eyebrow")}</span>
                  <h3 id="handoff-review-title" className="mt-1 text-xl tracking-tight">
                    {t("arch.review.title")}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("arch.review.body")}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <span className="rule-label text-signal-controlled">{t("arch.review.moving")}</span>
                      <ul className="mt-2 space-y-1 text-xs leading-relaxed">
                        {review.review.moving.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="rule-label">{t("arch.review.notMoving")}</span>
                      <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
                        {review.review.notMoving.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="rule-label text-signal-tight">{t("arch.review.needs")}</span>
                      <ul className="mt-2 space-y-1 text-xs leading-relaxed">
                        {review.review.needsConfirmation.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" className={btnPrimary} onClick={confirmApply}>
                      {t("arch.review.confirm")}
                    </button>
                    <button type="button" className={btn} onClick={() => setReview(null)}>
                      {t("arch.review.cancel")}
                    </button>
                  </div>
                </div>
              )}
              {linkMsg && (
                <p role="status" className="break-all border-l-2 border-accent pl-3 font-mono text-[10px]">
                  {linkMsg}
                </p>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">{t("arch.boundary")}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Minimal conditions stub for soft proposal links when handoff is blocked. Never invents seats. */
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
    diets: [] as string[],
    season: "winter" as const,
    budgetTier: 2 as const,
    kids: false,
    outdoor: false,
    leftovers: "some" as const,
    seatingKnown: input.seatingKnown === true,
    kitchen: {
      ovens: 1,
      burners: 4,
      grill: false,
      dishwasher: true,
      fridge: "normal" as const,
      counter: "medium" as const,
      seats: input.seatingKnown === true ? Number(input.seatingCount ?? 0) : 0,
    },
  };
}
