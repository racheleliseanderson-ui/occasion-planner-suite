import type { Plan } from "./types";

/**
 * The bridge between the planner and the menu builder. A route is handed over
 * through session storage rather than a URL: it is the host's own data, it never
 * leaves the device, and it disappears when the tab closes.
 */

const KEY = "oos-menu-handoff";

export interface MenuHandoff {
  label: string;
  serviceTime: string;
  guests: number;
  items: { id: string; name: string; note: string; course: string }[];
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
  };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* storage unavailable — the builder simply opens empty */
  }
}

export function takeMenu(): MenuHandoff | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MenuHandoff;
    return Array.isArray(parsed?.items) ? parsed : null;
  } catch {
    return null;
  }
}
