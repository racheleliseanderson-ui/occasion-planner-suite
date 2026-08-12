import type { Conditions, DietFilter, ServiceStyle } from "@/lib/oos/types";
import { DEFAULT_CONDITIONS } from "@/lib/oos/engine";
import {
  buildMenuOccasionHandoff,
  mapMenuOccasionHandoffToOccasionInput,
  validateMenuOccasionHandoff,
} from "./menu-occasion";
import type { MenuBuilderInput, MenuBuilderResult } from "./types";

const APPLY_KEY = "oos-architecture-apply-v1";
const PROPOSAL_KEY = "oos-architecture-proposal-v1";

export type ArchitectureApplyPayload = {
  savedAt: string;
  label: string;
  thesis: string;
  conditions: Conditions;
  roles?: Record<string, string> | undefined;
  handoff?: unknown;
};

/** Map SC-MB service style → OOS service style */
function mapStyle(s: string): ServiceStyle {
  if (s === "buffet") return "buffet";
  if (s === "grazing") return "grazing";
  return "seated";
}

function mapDiets(categories: string[], allergens: string[]): DietFilter[] {
  const out = new Set<DietFilter>();
  for (const c of categories) {
    const k = c.toLowerCase();
    if (k.includes("vegan") || k.includes("plant")) out.add("no-animal");
    else if (k.includes("vegetarian")) out.add("no-meat");
    else if (k.includes("gluten")) out.add("no-gluten");
    else if (k.includes("dairy")) out.add("no-dairy");
  }
  for (const a of allergens) {
    const k = a.toLowerCase();
    if (k.includes("gluten")) out.add("no-gluten");
    if (k.includes("milk") || k.includes("dairy")) out.add("no-dairy");
    if (k.includes("nut")) out.add("no-nut");
    if (k.includes("shellfish")) out.add("no-shellfish");
    if (k.includes("egg")) out.add("no-meat"); // soft mapping; egg not full animal ban
  }
  return [...out];
}

/**
 * Build a Conditions patch from architecture input + validated result.
 * Fail closed if handoff cannot be built (hard stops, invalid).
 */
export function buildApplyPayload(
  input: MenuBuilderInput,
  result: MenuBuilderResult,
): { ok: true; payload: ArchitectureApplyPayload } | { ok: false; errors: string[] } {
  const built = buildMenuOccasionHandoff(input, result);
  if (built.status !== "ready") {
    return { ok: false, errors: built.errors || ["Handoff not ready."] };
  }
  const mapped = mapMenuOccasionHandoffToOccasionInput(built.handoff);
  if (mapped.status === "invalid" || mapped.status === "blocked") {
    const errors: string[] =
      mapped.status === "blocked"
        ? [String((mapped as { message?: string }).message || "Handoff blocked.")]
        : ([...(((mapped as { errors?: string[] }).errors) || ["Could not map handoff."])].filter(Boolean) as string[]);
    return { ok: false, errors };
  }

  const mi = mapped.input;
  if (!mi) {
    return { ok: false, errors: ["Mapped occasion input missing."] };
  }

  const kitchen = { ...DEFAULT_CONDITIONS.kitchen };
  const eq = new Set((input.equipmentConstraints || []).filter(Boolean) as string[]);
  if (eq.has("limited_oven")) kitchen.ovens = Math.min(kitchen.ovens, 1);
  if (eq.has("limited_burners")) kitchen.burners = Math.min(kitchen.burners, 2);
  if (eq.has("limited_refrigeration")) kitchen.fridge = "tight";

  const avail = new Set((mi.availableEquipment || []).filter(Boolean) as string[]);
  if (!avail.has("oven")) kitchen.ovens = 0;
  if (!avail.has("stovetop")) kitchen.burners = 0;

  const attention = String(input.attentionBand);
  const helpers = attention === "high" ? 2 : attention === "low" ? 0 : 1;
  const prepWindowH =
    input.prepCapacity === "limited" ? 3 : input.prepCapacity === "generous" ? 8 : 5;

  const conditions: Conditions = {
    ...DEFAULT_CONDITIONS,
    label: input.occasion || "Architecture proposal",
    guests: Math.max(1, Number(input.guestCount) || DEFAULT_CONDITIONS.guests),
    style: mapStyle(String(mi.serviceStyle || "seated")),
    diets: mapDiets(
      (input.dietaryCategories || []).filter(Boolean) as string[],
      (input.declaredAllergens || []).filter(Boolean) as string[],
    ),
    helpers,
    prepWindowH,
    kitchen: {
      ...kitchen,
      seats: Math.max(kitchen.seats, Number(input.guestCount) || kitchen.seats),
    },
    ambition: input.menuArc === "celebratory" ? 3 : input.menuArc === "relaxed" ? 1 : 2,
    budgetTier: input.budgetPressure ? 1 : 2,
  };

  const payload: ArchitectureApplyPayload = {
    savedAt: new Date().toISOString(),
    label: conditions.label,
    thesis: String(result.thesis || ""),
    conditions,
    handoff: built.handoff,
  };
  if (result.roles && typeof result.roles === "object") {
    payload.roles = result.roles as Record<string, string>;
  }

  return { ok: true, payload };
}

export function stashApply(payload: ArchitectureApplyPayload) {
  try {
    sessionStorage.setItem(APPLY_KEY, JSON.stringify(payload));
  } catch {
    /* storage full or blocked */
  }
}

export function takeApply(): ArchitectureApplyPayload | null {
  try {
    const raw = sessionStorage.getItem(APPLY_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(APPLY_KEY);
    const parsed = JSON.parse(raw) as ArchitectureApplyPayload;
    if (!parsed?.conditions) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function stashProposal(payload: ArchitectureApplyPayload) {
  try {
    localStorage.setItem(PROPOSAL_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function loadProposals(): ArchitectureApplyPayload[] {
  try {
    const raw = localStorage.getItem(PROPOSAL_KEY);
    if (!raw) return [];
    const one = JSON.parse(raw) as ArchitectureApplyPayload;
    return one?.conditions ? [one] : [];
  } catch {
    return [];
  }
}

/** Encode a compact share token for a proposal (public-safe fields only). */
export function encodeProposalToken(payload: ArchitectureApplyPayload): string {
  const slim = {
    v: 1,
    label: payload.label,
    thesis: payload.thesis,
    conditions: payload.conditions,
    roles: payload.roles,
  };
  const json = JSON.stringify(slim);
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `a.${b64}`;
}

export function decodeProposalToken(token: string): ArchitectureApplyPayload | null {
  try {
    if (!token.startsWith("a.")) return null;
    const pad = token.length % 4 === 0 ? "" : "=".repeat(4 - (token.length % 4));
    const json = decodeURIComponent(
      escape(atob(token.slice(2).replace(/-/g, "+").replace(/_/g, "/") + pad)),
    );
    const parsed = JSON.parse(json);
    if (!parsed?.conditions) return null;
    return {
      savedAt: new Date().toISOString(),
      label: parsed.label || "Shared proposal",
      thesis: parsed.thesis || "",
      conditions: parsed.conditions,
      roles: parsed.roles,
      handoff: null,
    };
  } catch {
    return null;
  }
}

export function proposalShareUrl(token: string): string {
  const base = typeof window === "undefined" ? "" : window.location.origin;
  return `${base}/architecture?p=${token}`;
}

export { validateMenuOccasionHandoff };
