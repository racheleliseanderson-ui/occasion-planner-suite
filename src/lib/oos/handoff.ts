import type { Plan } from "./types";
import { ENGINE_VERSION, FIXTURE_VERSION } from "./versions";

/**
 * The bridge between the planner and the menu card. Consumed once.
 * A later Card visit will not silently reopen an old plan.
 */

const KEY = "oos-menu-handoff";
const RECEIPT_KEY = "oos-menu-handoff-receipt";

export interface MenuHandoff {
  label: string;
  serviceTime: string;
  guests: number;
  items: { id: string; name: string; note: string; course: string }[];
  signature: string;
  receivedAt: string;
  engineVersion: string;
  fixtureVersion: string;
  planLabel: string;
}

export interface MenuHandoffReceipt {
  signature: string;
  receivedAt: string;
  planLabel: string;
  consumed: boolean;
}

export function stashMenu(plan: Plan) {
  const payload: MenuHandoff = {
    label: plan.conditions.label,
    serviceTime: plan.conditions.serviceTime,
    guests: plan.conditions.guests,
    items: plan.menu.map((m) => ({
      id: m.dish.id,
      name: m.dish.name,
      note: m.dish.note,
      course: m.dish.course,
    })),
    signature: plan.signature,
    receivedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    fixtureVersion: FIXTURE_VERSION,
    planLabel: plan.conditions.label,
  };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(payload));
    window.sessionStorage.removeItem(RECEIPT_KEY);
  } catch {
    /* storage unavailable — the builder simply opens empty */
  }
}

/** Consume the payload once. Later visits see only the receipt. */
export function takeMenu(): MenuHandoff | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MenuHandoff;
    window.sessionStorage.removeItem(KEY);
    if (!Array.isArray(parsed?.items)) return null;
    const receipt: MenuHandoffReceipt = {
      signature: parsed.signature || parsed.planLabel || "unsigned",
      receivedAt: parsed.receivedAt || new Date().toISOString(),
      planLabel: parsed.planLabel || parsed.label,
      consumed: true,
    };
    window.sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
    return parsed;
  } catch {
    return null;
  }
}

export function lastMenuReceipt(): MenuHandoffReceipt | null {
  try {
    const raw = window.sessionStorage.getItem(RECEIPT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MenuHandoffReceipt;
  } catch {
    return null;
  }
}
