/**
 * House return-loop stubs — card draft + constraint handoff via sessionStorage.
 * Fail-closed; no PII.
 */
const CARD_DRAFT_KEY = "oos-card-draft-v1";
const CONSTRAINT_KEY = "oos-constraint-return-v1";

export type CardDraft = {
  label?: string;
  dishes?: string[];
  notes?: string;
  savedAt?: string;
};

export type ConstraintReturn = {
  label?: string;
  guests?: number;
  seatingKnown?: boolean;
  seatingCount?: number | null;
  outdoor?: boolean;
  note?: string;
  savedAt?: string;
};

export function stashCardDraft(draft: CardDraft): void {
  try {
    window.sessionStorage.setItem(
      CARD_DRAFT_KEY,
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
    );
  } catch {
    /* storage unavailable */
  }
}

export function peekCardDraft(): CardDraft | null {
  try {
    const raw = window.sessionStorage.getItem(CARD_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CardDraft;
  } catch {
    return null;
  }
}

export function takeConstraint(): ConstraintReturn | null {
  try {
    const raw = window.sessionStorage.getItem(CONSTRAINT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(CONSTRAINT_KEY);
    return JSON.parse(raw) as ConstraintReturn;
  } catch {
    return null;
  }
}

export function stashConstraint(c: ConstraintReturn): void {
  try {
    window.sessionStorage.setItem(
      CONSTRAINT_KEY,
      JSON.stringify({ ...c, savedAt: new Date().toISOString() }),
    );
  } catch {
    /* */
  }
}
