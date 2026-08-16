/**
 * Last-write-wins merge for the host workshop.
 *
 * Collections merge by id (then by name for kitchens / situations, so older
 * files that reminted ids still collide correctly). A record clock is its
 * `updatedAt`, or 0 if the file predates clocks. An incoming file with no
 * document clock is treated as written at import time — the host is applying
 * that file now.
 *
 * Deletes are tombstones in `removed`. A newer tombstone beats a live record.
 * Run history is this-device only and never taken from the incoming file
 * unless this device has none (a restore).
 *
 * Ties go to incoming — importing is an explicit act.
 */

import type { OosConfig, SavedScenario } from "./store";

export type MergeReport = {
  restored: boolean;
  added: number;
  tookIncoming: number;
  keptLocal: number;
  stayedRemoved: number;
};

export function workshopIsEmpty(c: OosConfig): boolean {
  return (
    c.customDishes.length === 0 &&
    Object.keys(c.dishOverrides).length === 0 &&
    c.hiddenDishIds.length === 0 &&
    c.kitchenProfiles.length === 0 &&
    c.savedScenarios.length === 0 &&
    Object.keys(c.removed).length === 0
  );
}

export function formatMergeReport(r: MergeReport, scope: "config" | "pack" = "config"): string {
  if (r.restored) {
    return scope === "pack" ? "Preset pack restored from file." : "Configuration restored from file.";
  }
  const bits = [
    `Incoming won ${r.tookIncoming}.`,
    `This device kept ${r.keptLocal}.`,
    `${r.added} added.`,
  ];
  if (r.stayedRemoved) bits.push(`${r.stayedRemoved} stayed removed.`);
  if (scope === "config") bits.push("Run history stayed on this device.");
  return `Merged. ${bits.join(" ")}`;
}

type Clocked = { id: string; name?: string | undefined; updatedAt?: number | undefined };

function clockOf(item: { updatedAt?: number | undefined } | undefined, fallback: number): number {
  return item?.updatedAt ?? fallback;
}

function incomingFallback(incoming: OosConfig, importedAt: number): number {
  return incoming.updatedAt ?? importedAt;
}

function tombOf(removed: Record<string, number>, id: string): number {
  return removed[id] ?? 0;
}

function mergeRemoved(
  local: Record<string, number>,
  incoming: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = { ...local };
  for (const id of Object.keys(incoming)) {
    const inc = incoming[id] ?? 0;
    if (inc > (out[id] ?? 0)) out[id] = inc;
  }
  return out;
}

function pickRecord<T extends Clocked>(
  local: T | undefined,
  incoming: T | undefined,
  localFb: number,
  incFb: number,
): { item: T; from: "local" | "incoming" } | null {
  if (!local && !incoming) return null;
  if (!local && incoming) return { item: incoming, from: "incoming" };
  if (local && !incoming) return { item: local, from: "local" };
  const lc = clockOf(local, localFb);
  const ic = clockOf(incoming, incFb);
  if (ic >= lc) return { item: incoming as T, from: "incoming" };
  return { item: local as T, from: "local" };
}

function indexById<T extends Clocked>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return map;
}

function indexByName<T extends Clocked>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (item.name) map.set(item.name, item);
  }
  return map;
}

function mergeCollection<T extends Clocked>(
  local: T[],
  incoming: T[],
  removed: Record<string, number>,
  localFb: number,
  incFb: number,
  cap: number,
  report: MergeReport,
): T[] {
  const localById = indexById(local);
  const incById = indexById(incoming);
  const localByName = indexByName(local);
  const incByName = indexByName(incoming);

  const seen = new Set<string>();
  const keys: { local?: T | undefined; incoming?: T | undefined }[] = [];

  const pushPair = (a?: T, b?: T) => {
    const id = a?.id ?? b?.id;
    if (!id || seen.has(id)) return;
    if (a) seen.add(a.id);
    if (b) seen.add(b.id);
    keys.push({ local: a, incoming: b });
  };

  for (const item of local) {
    const match = incById.get(item.id) ?? (item.name ? incByName.get(item.name) : undefined);
    pushPair(item, match);
  }
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    const match = localById.get(item.id) ?? (item.name ? localByName.get(item.name) : undefined);
    if (match && seen.has(match.id)) continue;
    pushPair(match, item);
  }

  const live: T[] = [];
  for (const pair of keys) {
    const picked = pickRecord(pair.local, pair.incoming, localFb, incFb);
    if (!picked) continue;
    const id = picked.item.id;
    const itemClock = clockOf(picked.item, picked.from === "incoming" ? incFb : localFb);
    if (tombOf(removed, id) > itemClock) {
      report.stayedRemoved += 1;
      continue;
    }
    if (pair.local && pair.incoming) {
      if (picked.from === "incoming") report.tookIncoming += 1;
      else report.keptLocal += 1;
    } else if (!pair.local && pair.incoming) {
      report.added += 1;
    }
    live.push(picked.item);
  }

  live.sort((a, b) => clockOf(b, 0) - clockOf(a, 0) || a.id.localeCompare(b.id));
  return live.slice(0, cap);
}

function mergeOverrides(
  local: OosConfig["dishOverrides"],
  incoming: OosConfig["dishOverrides"],
  removed: Record<string, number>,
  localFb: number,
  incFb: number,
  report: MergeReport,
): OosConfig["dishOverrides"] {
  const ids = new Set([...Object.keys(local), ...Object.keys(incoming)]);
  const out: OosConfig["dishOverrides"] = {};
  for (const id of ids) {
    const l = local[id];
    const i = incoming[id];
    const picked = pickRecord(
      l ? { ...l, id } : undefined,
      i ? { ...i, id } : undefined,
      localFb,
      incFb,
    );
    if (!picked) continue;
    const itemClock = clockOf(picked.item, picked.from === "incoming" ? incFb : localFb);
    if (tombOf(removed, id) > itemClock) {
      report.stayedRemoved += 1;
      continue;
    }
    if (l && i) {
      if (picked.from === "incoming") report.tookIncoming += 1;
      else report.keptLocal += 1;
    } else if (!l && i) {
      report.added += 1;
    }
    const { id: _id, ...rest } = picked.item;
    out[id] = rest;
  }
  return out;
}

function mergeHidden(
  localIds: string[],
  localClocks: Record<string, number>,
  incIds: string[],
  incClocks: Record<string, number>,
  incFb: number,
  report: MergeReport,
): { hiddenDishIds: string[]; hiddenClocks: Record<string, number> } {
  const ids = new Set([...localIds, ...incIds, ...Object.keys(localClocks), ...Object.keys(incClocks)]);
  const hidden: string[] = [];
  const clocks: Record<string, number> = {};
  for (const id of ids) {
    const localIn = localIds.includes(id);
    const incIn = incIds.includes(id);
    const lc = localClocks[id] ?? 0;
    const stampedInc = Object.prototype.hasOwnProperty.call(incClocks, id);
    const ic = stampedInc ? (incClocks[id] ?? 0) : incIn ? incFb : 0;
    if (ic > lc) {
      clocks[id] = ic;
      if (incIn) hidden.push(id);
      if (localIn !== incIn) report.tookIncoming += 1;
    } else if (lc > ic) {
      clocks[id] = lc;
      if (localIn) hidden.push(id);
      if (localIn !== incIn) report.keptLocal += 1;
    } else if (incIn || localIn) {
      clocks[id] = Math.max(lc, ic);
      hidden.push(id);
    }
  }
  return { hiddenDishIds: [...new Set(hidden)], hiddenClocks: clocks };
}

export function mergeConfigLww(
  local: OosConfig,
  incoming: OosConfig,
  importedAt = Date.now(),
): { config: OosConfig; report: MergeReport } {
  if (workshopIsEmpty(local)) {
    return {
      config: { ...incoming, updatedAt: incoming.updatedAt ?? importedAt },
      report: { restored: true, added: 0, tookIncoming: 0, keptLocal: 0, stayedRemoved: 0 },
    };
  }

  const report: MergeReport = {
    restored: false,
    added: 0,
    tookIncoming: 0,
    keptLocal: 0,
    stayedRemoved: 0,
  };

  const localFb = 0;
  const incFb = incomingFallback(incoming, importedAt);
  const removed = mergeRemoved(local.removed, incoming.removed);

  const customDishes = mergeCollection(
    local.customDishes,
    incoming.customDishes,
    removed,
    localFb,
    incFb,
    400,
    report,
  );
  const kitchenProfiles = mergeCollection(
    local.kitchenProfiles,
    incoming.kitchenProfiles,
    removed,
    localFb,
    incFb,
    30,
    report,
  );
  const savedScenarios = mergeCollection(
    local.savedScenarios,
    incoming.savedScenarios,
    removed,
    localFb,
    incFb,
    60,
    report,
  ) as SavedScenario[];

  const dishOverrides = mergeOverrides(
    local.dishOverrides,
    incoming.dishOverrides,
    removed,
    localFb,
    incFb,
    report,
  );

  const hidden = mergeHidden(
    local.hiddenDishIds,
    local.hiddenClocks,
    incoming.hiddenDishIds,
    incoming.hiddenClocks,
    incFb,
    report,
  );

  const liveIds = new Set<string>([
    ...customDishes.map((d) => d.id),
    ...kitchenProfiles.map((p) => p.id),
    ...savedScenarios.map((s) => s.id),
    ...Object.keys(dishOverrides),
  ]);
  const prunedRemoved: Record<string, number> = {};
  for (const [id, at] of Object.entries(removed)) {
    if (!liveIds.has(id)) prunedRemoved[id] = at;
  }

  const runHistory = local.runHistory.length > 0 ? local.runHistory : incoming.runHistory;
  // Paper settings are a local preference: the newer side wins outright.
  const printLayout =
    (incoming.updatedAt ?? 0) > (local.updatedAt ?? 0) ? incoming.printLayout : local.printLayout;

  return {
    config: {
      version: 1,
      updatedAt: Math.max(local.updatedAt ?? 0, incoming.updatedAt ?? 0, importedAt),
      customDishes,
      printLayout,
      dishOverrides,
      hiddenDishIds: hidden.hiddenDishIds,
      hiddenClocks: hidden.hiddenClocks,
      kitchenProfiles,
      savedScenarios,
      runHistory,
      removed: prunedRemoved,
    },
    report,
  };
}

export function mergeScenarioPackLww(
  local: SavedScenario[],
  incoming: SavedScenario[],
  removed: Record<string, number>,
  importedAt = Date.now(),
): { items: SavedScenario[]; report: MergeReport; removed: Record<string, number> } {
  const report: MergeReport = {
    restored: local.length === 0,
    added: 0,
    tookIncoming: 0,
    keptLocal: 0,
    stayedRemoved: 0,
  };
  const items = mergeCollection(local, incoming, removed, 0, importedAt, 60, report);
  const live = new Set(items.map((s) => s.id));
  const nextRemoved = { ...removed };
  for (const s of items) delete nextRemoved[s.id];
  for (const id of Object.keys(nextRemoved)) {
    if (live.has(id)) delete nextRemoved[id];
  }
  return { items: items as SavedScenario[], report, removed: nextRemoved };
}
