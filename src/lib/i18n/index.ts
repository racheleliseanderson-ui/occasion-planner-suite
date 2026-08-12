import { useCallback } from "react";
import { en } from "./en";

export type Locale = "en";
export type Key = keyof typeof en;

export const LOCALES: Locale[] = ["en"];
export const LOCALE_LABELS: Record<Locale, string> = { en: "English" };
export const LOCALE_SHORT: Record<Locale, string> = { en: "EN" };

/** English-only catalogue. Spanish removed. */
export function translate(_locale: Locale, key: Key): string {
  return en[key];
}

export function setLocale(_next: Locale) {
  /* English only — no-op kept for call-site compatibility */
}

/** Always English. Server and client match. */
export function useT() {
  const t = useCallback((key: Key) => en[key], []);
  return { t, locale: "en" as Locale, setLocale, locales: LOCALES };
}

export function fmtNumber(_locale: Locale, n: number, digits = 2): string {
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function fmtDate(_locale: Locale, iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
