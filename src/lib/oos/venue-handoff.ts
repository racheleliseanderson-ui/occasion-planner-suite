/**
 * Venue Intelligence → Occasion OS handoff.
 * Fail-closed: no guest names, no invented seats, residuals stay visible.
 */
import type { Conditions, OccasionShape, ServiceStyle } from "./types";
import { DEFAULT_CONDITIONS } from "./engine";

export const VENUE_HANDOFF_VERSION = "1.0.0";
export const VENUE_HANDOFF_KEY = "oos-venue-handoff-v1";
export const VENUE_HANDOFF_HASH = "vo";

export type VenueToOccasionPayload = {
  v: typeof VENUE_HANDOFF_VERSION;
  from: "venue-intelligence";
  venue: {
    id: string;
    name: string;
    region?: string;
    placeType?: string;
  };
  scenario: {
    label: string;
    guests: number;
    outdoor?: boolean;
    seatingKnown: boolean;
    seatingCount?: number | null;
    shape?: OccasionShape;
    style?: ServiceStyle;
  };
  constraints?: {
    kitchenHints?: string[];
    outdoorOps?: {
      shade?: boolean;
      power?: boolean;
      weatherRisk?: "low" | "medium" | "high";
    };
    residuals?: string[];
  };
  thesis: string;
  signature: string;
  createdAt: string;
  reopen?: string;
};

export type VenueApplyResult = {
  conditions: Conditions;
  thesis: string;
  venue: VenueToOccasionPayload["venue"];
  residuals: string[];
  reopen?: string;
  signature: string;
};

function mapShape(label: string): OccasionShape {
  const l = label.toLowerCase();
  if (l.includes("brunch")) return "brunch";
  if (l.includes("reception") || l.includes("cocktail")) return "reception";
  if (l.includes("cookout") || l.includes("outdoor")) return "cookout";
  if (l.includes("aperitivo") || l.includes("aperitif")) return "aperitivo";
  return "dinner";
}

function mapStyle(label: string, outdoor?: boolean): ServiceStyle {
  const l = label.toLowerCase();
  if (l.includes("buffet")) return "buffet";
  if (l.includes("grazing") || l.includes("stations")) return "grazing";
  if (l.includes("cocktail") || l.includes("standing")) return "cocktail";
  if (outdoor && (l.includes("farm") || l.includes("garden"))) return "seated";
  return "seated";
}

/** Map a validated venue payload into Occasion conditions. Never invent seats. */
export function conditionsFromVenuePayload(p: VenueToOccasionPayload): Conditions {
  const guests =
    Number.isFinite(p.scenario.guests) && p.scenario.guests > 0
      ? Math.min(200, Math.floor(p.scenario.guests))
      : DEFAULT_CONDITIONS.guests;

  const seatingKnown = p.scenario.seatingKnown === true;
  const seatingCount =
    seatingKnown &&
    p.scenario.seatingCount != null &&
    Number.isFinite(p.scenario.seatingCount) &&
    p.scenario.seatingCount >= 0
      ? Math.floor(p.scenario.seatingCount)
      : null;

  const shape = p.scenario.shape ?? mapShape(p.scenario.label);
  const style = p.scenario.style ?? mapStyle(p.scenario.label, p.scenario.outdoor);

  const label = [p.venue.name, p.scenario.label].filter(Boolean).join(" · ").slice(0, 80);

  return {
    ...DEFAULT_CONDITIONS,
    label: label || DEFAULT_CONDITIONS.label,
    guests,
    shape,
    style,
    outdoor: p.scenario.outdoor === true,
    seatingKnown,
    kitchen: {
      ...DEFAULT_CONDITIONS.kitchen,
      seats: seatingCount != null ? seatingCount : DEFAULT_CONDITIONS.kitchen.seats,
    },
  };
}

function isPayload(value: unknown): value is VenueToOccasionPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.v !== VENUE_HANDOFF_VERSION) return false;
  if (v.from !== "venue-intelligence") return false;
  if (!v.venue || typeof v.venue !== "object") return false;
  if (!v.scenario || typeof v.scenario !== "object") return false;
  const venue = v.venue as Record<string, unknown>;
  const scenario = v.scenario as Record<string, unknown>;
  if (typeof venue.id !== "string" || typeof venue.name !== "string") return false;
  if (typeof scenario.label !== "string") return false;
  if (typeof scenario.guests !== "number" || !Number.isFinite(scenario.guests)) return false;
  if (typeof scenario.seatingKnown !== "boolean") return false;
  if (typeof v.thesis !== "string" || typeof v.signature !== "string") return false;
  return true;
}

export function encodeVenuePayload(p: VenueToOccasionPayload): string {
  const json = JSON.stringify(p);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeVenuePayload(token: string): VenueToOccasionPayload | null {
  try {
    const pad = token.length % 4 === 0 ? "" : "=".repeat(4 - (token.length % 4));
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as unknown;
    return isPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function stashVenueHandoff(p: VenueToOccasionPayload): void {
  try {
    window.sessionStorage.setItem(VENUE_HANDOFF_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable */
  }
}

function readSession(): VenueToOccasionPayload | null {
  try {
    const raw = window.sessionStorage.getItem(VENUE_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readHash(): VenueToOccasionPayload | null {
  try {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return null;
    const params = new URLSearchParams(hash.includes("=") ? hash : "");
    let token = params.get(VENUE_HANDOFF_HASH);
    if (!token && hash.startsWith(`${VENUE_HANDOFF_HASH}=`)) {
      token = decodeURIComponent(hash.slice(VENUE_HANDOFF_HASH.length + 1).split("&")[0] ?? "");
    }
    if (!token) return null;
    return decodeVenuePayload(token);
  } catch {
    return null;
  }
}

function clearSources(fromHash: boolean): void {
  try {
    window.sessionStorage.removeItem(VENUE_HANDOFF_KEY);
  } catch {
    /* */
  }
  if (fromHash && typeof window !== "undefined") {
    try {
      const url = new URL(window.location.href);
      const hash = url.hash.replace(/^#/, "");
      if (!hash) return;
      if (hash.startsWith(`${VENUE_HANDOFF_HASH}=`) || hash.includes(`${VENUE_HANDOFF_HASH}=`)) {
        const params = new URLSearchParams(hash);
        params.delete(VENUE_HANDOFF_HASH);
        const next = params.toString();
        url.hash = next ? next : "";
        window.history.replaceState(null, "", url.pathname + url.search + (url.hash ? `#${url.hash}` : ""));
      }
    } catch {
      /* */
    }
  }
}

/**
 * Consume a venue handoff once (hash preferred, then session).
 * Returns conditions ready for Plan + residual copy for the status strip.
 */
export function takeVenueApply(): VenueApplyResult | null {
  if (typeof window === "undefined") return null;
  const fromHash = readHash();
  const payload = fromHash ?? readSession();
  if (!payload) return null;
  clearSources(Boolean(fromHash));
  const conditions = conditionsFromVenuePayload(payload);
  return {
    conditions,
    thesis: payload.thesis,
    venue: payload.venue,
    residuals: payload.constraints?.residuals ?? [],
    reopen: payload.reopen,
    signature: payload.signature,
  };
}

/** Build Occasion deep-link from a payload (for VI CTA). */
export function occasionUrlFromVenuePayload(
  p: VenueToOccasionPayload,
  base = "https://occasion.saltnotes.blog/",
): string {
  const token = encodeVenuePayload(p);
  const url = new URL(base);
  url.hash = `${VENUE_HANDOFF_HASH}=${token}`;
  return url.toString();
}
