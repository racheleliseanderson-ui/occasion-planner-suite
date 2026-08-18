/**
 * Session bridges for Card drafts and Architecture constraint handoffs.
 * Local-only; never enters share links.
 */

const CARD_KEY = "oos-card-draft";
const CONSTRAINT_KEY = "oos-architecture-constraint";

export interface CardDraftLine {
  id: string;
  name: string;
  note: string;
  course: string;
  show: boolean;
  showCourse: boolean;
}

export interface CardDraft {
  savedAt: string;
  title: string;
  subtitle: string;
  footer: string;
  lines: CardDraftLine[];
  planSignature: string;
}

export function stashCardDraft(draft: CardDraft): void {
  try {
    window.sessionStorage.setItem(CARD_KEY, JSON.stringify(draft));
  } catch {
    /* storage unavailable */
  }
}

export function peekCardDraft(): CardDraft | null {
  try {
    const raw = window.sessionStorage.getItem(CARD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CardDraft;
    if (!Array.isArray(parsed?.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCardDraft(): void {
  try {
    window.sessionStorage.removeItem(CARD_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Architecture constraint packet stashed from Plan or external entry. */
export type ArchitectureConstraint = Record<string, unknown>;

export function stashConstraint(c: ArchitectureConstraint): void {
  try {
    window.sessionStorage.setItem(CONSTRAINT_KEY, JSON.stringify(c));
  } catch {
    /* storage unavailable */
  }
}

/** Consume once. */
export function takeConstraint(): ArchitectureConstraint | null {
  try {
    const raw = window.sessionStorage.getItem(CONSTRAINT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(CONSTRAINT_KEY);
    return JSON.parse(raw) as ArchitectureConstraint;
  } catch {
    return null;
  }
}
