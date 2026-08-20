/**
 * Drink role assignment and stress helpers for the Architecture drink track.
 * Fail-closed, resource-aware. Equal-status zero-proof is non-negotiable
 * unless the host explicitly declares alcoholic-only.
 */

import type { DrinkRole, BeverageRoute, ScoreBand } from "./types";
import { scoreBand } from "./labels";

/** Preferred fixtures for each drink role (ordered by preference). */
export const DRINK_ROLE_CANDIDATES: Record<DrinkRole, string[]> = {
  arrival: [
    "drink-zero",
    "drink-shrub",
    "pairing-bitter-orange",
    "cn-cold-brew-batch",
    "mx-agua-fresca",
    "cw-drink-lemonade-stand",
  ],
  volume: [
    "cw-drink-batched-punch",
    "drink-batched-negroni",
    "cw-drink-iced-tea-urn",
    "cw-drink-no-alcohol-cooler",
    "drink-wine",
    "cn-cheap-house-wine",
    "pairing-dry-cider",
  ],
  cut: [
    "drink-shrub",
    "pairing-bitter-orange",
    "cw-drink-spritz-station",
    "jp-umeshu-soda",
    "ae-ouzo-spritz-drink",
    "pairing-gin-tonic",
  ],
  equal: [
    "drink-zero",
    "cw-drink-no-alcohol-cooler",
    "pairing-bitter-orange",
    "cw-drink-lemonade-stand",
    "mx-agua-fresca",
    "cn-powdered-lemonade",
    "fa-doogh-drink",
    "zh-chrysanthemum-tea-drink",
  ],
  station: [
    "cw-drink-spritz-station",
    "cw-drink-frozen-margarita-batch",
    "cw-drink-mulled-wine-pot",
    "cw-drink-hot-cider-urn",
    "drink-hot-punch",
    "non-food-service",
  ],
};

/** Human-readable role guidance. */
export const DRINK_ROLE_GUIDANCE: Record<DrinkRole, string> = {
  arrival: "Ready when guests arrive. Low host attention at the door.",
  volume: "Scalable main pour that carries the evening. Prefer batched.",
  cut: "High-impact contrast (acid, bitter, sparkling, or bright zero-proof).",
  equal: "Locked equal-status zero-proof peer. Never a fallback.",
  station: "Last-mile operational piece: dispenser, build-your-own, hot hold, or ice/garnish.",
};

/**
 * Choose a primary + alternatives for a role from the available drink ids.
 */
export function pickForRole(
  role: DrinkRole,
  availableIds: Set<string>,
  mode: BeverageRoute | string,
  lockedEqualId?: string | null,
): { primaryId: string | null; alternativeIds: string[] } {
  const candidates = DRINK_ROLE_CANDIDATES[role] || [];
  const filtered = candidates.filter((id) => availableIds.has(id));

  if (role === "equal" && lockedEqualId && availableIds.has(lockedEqualId)) {
    return {
      primaryId: lockedEqualId,
      alternativeIds: filtered.filter((id) => id !== lockedEqualId).slice(0, 3),
    };
  }

  const primaryId = filtered[0] ?? null;
  const alternativeIds = filtered.slice(1, 4);
  return { primaryId, alternativeIds };
}

/** Minimal beverage stress dimensions. Real scoring uses fixture resource numbers. */
export function buildBeverageStress(input: {
  mode: BeverageRoute | string;
  hasEqual: boolean;
  iceHeavy: boolean;
  hotStation: boolean;
  attentionBand: string;
}): {
  score: number;
  band: ScoreBand;
  dimensions: Record<string, number>;
  weakDimensions: Array<{ dimension: string; score: number; band: string }>;
  verdict: string;
} {
  const dimensions: Record<string, number> = {
    batchStability: 78,
    coldIceLoad: input.iceHeavy ? 55 : 82,
    serviceAttention: input.attentionBand === "low" ? 70 : 85,
    equipmentContention: input.hotStation ? 58 : 88,
    equalVisibility: input.hasEqual || input.mode === "alcoholic" ? 90 : 35,
    makeAheadWindow: 80,
    serviceStyleFit: 75,
  };

  if (input.mode === "zero_proof" && !input.hasEqual) {
    dimensions.equalVisibility = 20;
  }

  const scores = Object.values(dimensions);
  const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const band = scoreBand(score);
  const weakDimensions = Object.entries(dimensions)
    .filter(([, s]) => s < 60)
    .map(([dimension, s]) => ({ dimension, score: s, band: scoreBand(s) }));

  let verdict =
    weakDimensions.length === 0
      ? "Beverage route is operationally balanced enough to hand off."
      : `Beverage route needs correction on ${weakDimensions.map((w) => w.dimension).join(" and ")} before locking.`;

  if (dimensions.equalVisibility < 50 && input.mode !== "alcoholic") {
    verdict =
      "Equal-status zero-proof is missing or invisible. Lock an Equal role drink or declare alcoholic-only.";
  }

  return { score, band, dimensions, weakDimensions, verdict };
}
