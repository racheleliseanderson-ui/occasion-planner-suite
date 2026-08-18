import type { Conditions, StopAction } from "./types";

export type { StopAction };

/**
 * Apply a stop correction to conditions.
 * Stub: returns conditions unchanged until correction recipes are wired.
 */
export function applyAction(conditions: Conditions, _action: StopAction): Conditions {
  return conditions;
}
