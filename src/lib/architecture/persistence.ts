import type { HistoryEntry, MenuBuilderInput } from "./types";
import { HISTORY_KEY, STORAGE_KEY } from "./types";

export function loadSavedInput(): MenuBuilderInput | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as MenuBuilderInput;
  } catch {
    return null;
  }
}

export function saveInput(input: MenuBuilderInput): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    return true;
  } catch {
    return false;
  }
}

export function clearSavedInput(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(list) ? (list as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: HistoryEntry): boolean {
  try {
    const list = loadHistory().filter((h) => h.id !== entry.id);
    list.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 6)));
    return true;
  } catch {
    return false;
  }
}

export function removeHistoryEntry(id: string): boolean {
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(loadHistory().filter((h) => h.id !== id)),
    );
    return true;
  } catch {
    return false;
  }
}
