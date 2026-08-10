import { useMemo, useRef, useState } from "react";
import type { Conditions } from "@/lib/oos/types";
import { SCENARIOS, type Scenario } from "@/lib/oos/scenarios";
import {
  deleteScenario,
  duplicateScenario,
  exportScenarioPack,
  importScenarioPack,
  restoreScenario,
  toggleScenarioPin,
  updateScenario,
  useConfig,
  type SavedScenario,
} from "@/lib/oos/store";
import { diffConditions } from "@/lib/oos/diff";
import { download } from "@/lib/oos/export";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const FAMILIES: Scenario["family"][] = ["Table", "Crowd", "Constrained", "Outdoor"];

const tiny =
  "min-h-11 px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:min-h-9";

function headline(patch: Partial<Conditions>): string {
  const bits: string[] = [];
  if (patch.guests) bits.push(`${patch.guests}`);
  if (patch.style) bits.push(patch.style);
  if (patch.serviceTime) bits.push(patch.serviceTime);
  return bits.join(" · ");
}

export function ScenarioGallery({
  onLoad,
  activeLabel,
  current,
}: {
  onLoad: (patch: Partial<Conditions>) => void;
  activeLabel: string;
  current?: Conditions;
}) {
  const config = useConfig();
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<"all" | Scenario["family"]>("all");
  const [pending, setPending] = useState<{ name: string; patch: Partial<Conditions> } | null>(null);
  const [undo, setUndo] = useState<{ scenario: SavedScenario; index: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      SCENARIOS.filter(
        (s) =>
          (family === "all" || s.family === family) &&
          (!q ||
            s.label.toLowerCase().includes(q) ||
            s.note.toLowerCase().includes(q) ||
            String(s.patch.guests ?? "").includes(q) ||
            String(s.patch.style ?? "").includes(q)),
      ),
    [family, q],
  );

  const saved = useMemo(
    () =>
      [...config.savedScenarios].sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt,
      ),
    [config.savedScenarios],
  );

  const request = (name: string, patch: Partial<Conditions>) => {
    if (!current) {
      onLoad(patch);
      return;
    }
    setPending({ name, patch });
  };

  const diff = pending && current ? diffConditions(current, { ...current, ...pending.patch } as Conditions) : [];

  return (
    <div className="space-y-8">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="scen-search">
          {t("scen.search")}
        </label>
        <input
          id="scen-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("scen.searchPlaceholder")}
          className="min-h-11 flex-1 border border-border bg-card px-3 py-2 text-sm"
        />
        <div role="group" aria-label={t("scen.search")} className="flex flex-wrap border border-border">
          {(["all", ...FAMILIES] as const).map((f, i) => (
            <button
              key={f}
              type="button"
              onClick={() => setFamily(f)}
              aria-pressed={family === f}
              className={cn(
                "min-h-11 px-3 font-mono text-[10px] uppercase tracking-widest transition-colors sm:min-h-9",
                i > 0 && "border-l border-border",
                family === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? t("scen.all") : f}
            </button>
          ))}
        </div>
      </div>

      {matches.length === 0 && <p className="text-sm text-muted-foreground">{t("scen.none")}</p>}

      {FAMILIES.filter((f) => matches.some((s) => s.family === f)).map((f) => (
        <div key={f}>
          <span className="rule-label">{f}</span>
          <div className="mt-3 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {matches
              .filter((s) => s.family === f)
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => request(s.label, s.patch)}
                  className={cn(
                    "min-h-11 bg-card px-4 py-4 text-left transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground",
                    activeLabel === s.patch.label && "bg-secondary",
                  )}
                >
                  <span className="block text-sm">{s.label}</span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.note}
                  </span>
                  <span className="mt-2 block font-mono text-[10px] tabular-nums text-muted-foreground">
                    {headline(s.patch)}
                  </span>
                </button>
              ))}
          </div>
        </div>
      ))}

      {/* Saved presets */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rule-label">{t("scen.saved")}</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={tiny}
              onClick={() => download("oos-preset-pack.json", "application/json", exportScenarioPack())}
            >
              {t("scen.exportPack")}
            </button>
            <button type="button" className={tiny} onClick={() => fileRef.current?.click()}>
              {t("scen.importPack")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) importScenarioPack(await file.text());
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {saved.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("scen.savedNone")}</p>
        ) : (
          <div className="mt-3 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((s) => (
              <div key={s.id} className="bg-card px-4 py-4">
                <button
                  type="button"
                  onClick={() => request(s.name, s.conditions as unknown as Partial<Conditions>)}
                  className="block w-full text-left"
                >
                  <span className="block text-sm">
                    {s.pinned && <span aria-hidden="true">▲ </span>}
                    {s.name}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.note || t("scen.savedBy")}
                    {s.kitchenProfile ? ` · ${s.kitchenProfile}` : ""}
                  </span>
                </button>
                <div className="mt-1 flex flex-wrap gap-x-1">
                  <button type="button" className={tiny} onClick={() => toggleScenarioPin(s.id)}>
                    {s.pinned ? t("scen.unpin") : t("scen.pin")}
                  </button>
                  <button
                    type="button"
                    className={tiny}
                    onClick={() => {
                      const name = window.prompt(t("scen.rename"), s.name)?.trim();
                      if (name) updateScenario(s.id, { name: name.slice(0, 60) });
                    }}
                  >
                    {t("scen.rename")}
                  </button>
                  <button type="button" className={tiny} onClick={() => duplicateScenario(s.id)}>
                    {t("scen.duplicate")}
                  </button>
                  <button
                    type="button"
                    className={`${tiny} hover:text-signal-over`}
                    onClick={() => {
                      setUndo({ scenario: s, index: config.savedScenarios.findIndex((x) => x.id === s.id) });
                      deleteScenario(s.id);
                    }}
                  >
                    {t("scen.remove")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {undo && (
          <p role="status" className="mt-3 flex items-center gap-3 border-l-2 border-accent pl-3 text-sm">
            {t("scen.removed")}: {undo.scenario.name}
            <button
              type="button"
              className={tiny}
              onClick={() => {
                restoreScenario(undo.scenario, undo.index);
                setUndo(null);
              }}
            >
              {t("scen.undo")}
            </button>
          </p>
        )}
      </div>

      {/* Preset diff */}
      {pending && (
        <div className="border border-foreground bg-card p-5">
          <span className="rule-label">{t("scen.diffTitle")}</span>
          <p className="mt-1 text-sm font-medium">{pending.name}</p>
          {diff.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("scen.diffNone")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border border-t border-border">
              {diff.map((d) => (
                <li key={d.field} className="grid gap-1 py-2 text-sm sm:grid-cols-[10rem_1fr]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {d.field}
                  </span>
                  <span>
                    <span className="text-muted-foreground line-through">{d.from}</span>
                    <span className="mx-2" aria-hidden="true">
                      →
                    </span>
                    <span className="font-medium">{d.to}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onLoad(pending.patch);
                setPending(null);
              }}
              className="min-h-11 bg-foreground px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-background"
            >
              {t("scen.diffApply")}
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="min-h-11 border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:border-foreground hover:text-foreground"
            >
              {t("scen.diffCancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
