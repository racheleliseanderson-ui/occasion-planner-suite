import type { Conditions } from "./types";

/** Host-facing correction offered from a stop on the plan. */
export interface StopAction {
  id: string;
  label: string;
  preview: string;
}

/**
 * Apply a stop correction to conditions.
 * Stub: returns conditions unchanged until correction recipes are wired.
 */
export function applyAction(conditions: Conditions, _action: StopAction): Conditions {
  return conditions;
}
