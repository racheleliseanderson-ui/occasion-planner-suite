import type { Conditions, DietFilter, LockedMenu, ServiceStyle } from "@/lib/oos/types";
import { DEFAULT_CONDITIONS } from "@/lib/oos/engine";
import {
  buildMenuOccasionHandoff,
  kitchenFromLimits,
  mapMenuOccasionHandoffToOccasionInput,
  type HandoffPacket,
} from "./contract";
import { overlayFromDishIds } from "./bridge";
import type { MenuBuilderInput, MenuBuilderResult } from "./types";

const APPLY_KEY = "oos-architecture-apply-v2";
const PROPOSAL_KEY = "oos-architecture-proposal-v2";

export type HandoffReview = {
  moving: string[];
  notMoving: string[];
  needsConfirmation: string[];
};

export type ArchitectureApplyPayload = {
  savedAt: string;
  label: string;
  thesis: string;
  conditions: Conditions;
  roles?: Record<string, string>;
  handoff?: HandoffPacket | null;
  overlayDishes?: ReturnType<typeof overlayFromDishIds>;
  review: HandoffReview;
};

function mapStyle(s: string): ServiceStyle {
  if (s === "buffet") return "buffet";
  if (s === "grazing") return "grazing";
  if (s === "cocktail") return "cocktail";
  return "seated";
}

export function describeReview(input: MenuBuilderInput, packet: HandoffPacket, diets: DietFilter[]): HandoffReview {
  const moving = [
    `${packet.guestCount} guests`,
    `${packet.serviceStyle} service`,
    packet.lockedAnchorId ? `locked anchor ${packet.lockedAnchorId}` : "selected architecture dishes",
    diets.length ? `dietary: ${diets.join(", ")}` : "no dietary filters",
    packet.equipmentLimits.oven === "limited"
      ? "limited oven (capacity reduced, not removed)"
      : packet.equipmentLimits.oven === "none"
        ? "no oven"
        : "full oven access",
    packet.equipmentLimits.burners === "limited" ? "limited burners (two remain)" : "declared burners",
  ];
  if (packet.menuThesis) moving.push(`thesis: ${packet.menuThesis}`);
  if (packet.beverageDirection) moving.push("beverage direction");
  if (packet.zeroProofDirection) moving.push("zero-proof direction");
  if (packet.simplifications.length) moving.push(`${packet.simplifications.length} simplifications`);

  const notMoving = [
    "exact fridge inventory",
    "service date (set on Plan if you have one)",
    "dishwasher (confirm on Plan)",
    "outdoor weather",
  ];

  const needsConfirmation: string[] = [];
  if (!packet.seatingDeclared) needsConfirmation.push("seats — Architecture did not invent chairs");
  needsConfirmation.push("dishwasher availability");
  if (input.equipmentConstraints?.includes("limited_refrigeration")) {
    needsConfirmation.push("cold storage capacity");
  }

  return { moving, notMoving, needsConfirmation };
}

/**
 * Build a Conditions patch from architecture input + validated result.
 * Fail closed if handoff cannot be built (hard stops, invalid).
 * Never invents seats. Limited equipment stays limited, not absent.
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
        ? [String(mapped.message || "Handoff blocked.")]
        : [...(mapped.errors || ["Could not map handoff."])];
    return { ok: false, errors };
  }

  const mi = mapped.input;
  const kitchenBase = { ...DEFAULT_CONDITIONS.kitchen };
  const limited = kitchenFromLimits(mi.equipmentLimits, kitchenBase);

  const seatingKnown = mi.seatingDeclared && mi.seatingCount !== null;
  const seats = seatingKnown ? Number(mi.seatingCount) : 0;

  const attention = String(input.attentionBand);
  const helpers = attention === "high" ? 2 : attention === "low" ? 0 : 1;
  const prepWindowH = input.prepCapacity === "limited" ? 3 : input.prepCapacity === "generous" ? 8 : 5;

  const lockedMenu: LockedMenu = {
    dishIds: mi.selectedDishIds,
    roles: { ...(result.roles || {}) },
    lockedAnchorId: mi.lockedAnchorId,
    thesis: String(result.thesis || ""),
    beverageDirection: String(result.beverageDirection || built.handoff.beverageDirection),
    zeroProofDirection: built.handoff.zeroProofDirection,
    simplifications: [...(result.simplifyFirst || [])],
    unknowns: [...built.handoff.unknowns],
    substitutions: [],
    signature: built.handoff.signature,
    source: {
      tool: "architecture",
      contractVersion: built.handoff.contractVersion,
      engineVersion: built.handoff.engineVersion,
      fixtureVersion: built.handoff.fixtureVersion,
      createdAt: built.handoff.createdAt,
    },
  };

  const conditions: Conditions = {
    ...DEFAULT_CONDITIONS,
    label: input.occasion || "Architecture proposal",
    guests: Math.max(1, Number(input.guestCount) || DEFAULT_CONDITIONS.guests),
    style: mapStyle(String(mi.serviceStyle || "seated")),
    diets: mi.diets,
    helpers,
    prepWindowH,
    seatingKnown,
    lockedMenu,
    kitchen: {
      ...kitchenBase,
      ovens: limited.ovens,
      burners: limited.burners,
      fridge: limited.fridge,
      ovenLimited: limited.ovenLimited,
      burnerLimited: limited.burnerLimited,
      seats,
    },
    ambition: input.menuArc === "celebratory" ? 3 : input.menuArc === "relaxed" ? 1 : 2,
    budgetTier: input.budgetPressure ? 1 : 2,
  };

  const payload: ArchitectureApplyPayload = {
    savedAt: new Date().toISOString(),
    label: conditions.label,
    thesis: String(result.thesis || ""),
    conditions,
    overlayDishes: overlayFromDishIds(mi.selectedDishIds),
    review: describeReview(input, built.handoff, mi.diets),
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
    const raw = sessionStorage.getItem(APPLY_KEY) ?? sessionStorage.getItem("oos-architecture-apply-v1");
    if (!raw) return null;
    sessionStorage.removeItem(APPLY_KEY);
    sessionStorage.removeItem("oos-architecture-apply-v1");
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

export function encodeProposalToken(payload: ArchitectureApplyPayload): string {
  const slim = {
    v: 2,
    label: payload.label,
    thesis: payload.thesis,
    conditions: payload.conditions,
    roles: payload.roles,
    overlay: payload.overlayDishes,
    signature: payload.handoff?.signature,
    engineVersion: payload.handoff?.engineVersion,
    fixtureVersion: payload.handoff?.fixtureVersion,
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
      overlayDishes: parsed.overlay,
      handoff: null,
      review: {
        moving: ["shared proposal"],
        notMoving: [],
        needsConfirmation: parsed.conditions?.seatingKnown === false ? ["seats"] : [],
      },
    };
  } catch {
    return null;
  }
}

export function proposalShareUrl(token: string): string {
  const base = typeof window === "undefined" ? "" : window.location.origin;
  return `${base}/architecture?p=${token}`;
}

export { validateMenuOccasionHandoff } from "./contract";
