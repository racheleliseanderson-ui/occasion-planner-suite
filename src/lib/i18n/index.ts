import { useCallback, useEffect, useSyncExternalStore } from "react";
import { en } from "./en";
import { es } from "./es";

export type Locale = "en" | "es";
export type Key = keyof typeof en;

export const LOCALES: Locale[] = ["en", "es"];
export const LOCALE_LABELS: Record<Locale, string> = { en: "English", es: "Español" };
export const LOCALE_SHORT: Record<Locale, string> = { en: "EN", es: "ES" };

const CATALOGUES: Record<Locale, Record<Key, string>> = { en, es };
const KEY = "oos-lang";

function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "es";
}

/** Locale precedence: explicit ?lang= in the link, then the device, then English. */
function resolve(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (isLocale(fromUrl)) return fromUrl;
    const stored = window.localStorage.getItem(KEY);
    if (isLocale(stored)) return stored;
    if (navigator.language.toLowerCase().startsWith("es")) return "es";
  } catch {
    /* storage or URL unavailable */
  }
  return "en";
}

let current: Locale = "en";
let loaded = false;
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  if (!loaded && typeof window !== "undefined") {
    current = resolve();
    loaded = true;
    document.documentElement.lang = current;
  }
  listeners.add(l);
  return () => listeners.delete(l);
}

function snapshot(): Locale {
  if (!loaded && typeof window !== "undefined") {
    current = resolve();
    loaded = true;
  }
  return current;
}

export function setLocale(next: Locale) {
  current = next;
  loaded = true;
  try {
    window.localStorage.setItem(KEY, next);
    document.documentElement.lang = next;
    const url = new URL(window.location.href);
    if (url.searchParams.has("lang")) {
      url.searchParams.set("lang", next);
      window.history.replaceState(null, "", url.toString());
    }
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((fn) => fn());
}

export function translate(locale: Locale, key: Key): string {
  return CATALOGUES[locale][key] ?? en[key];
}

/** The reader's language. Server render is always English to keep hydration honest. */
export function useT() {
  const locale = useSyncExternalStore(subscribe, snapshot, () => "en" as Locale);
  const t = useCallback((key: Key) => translate(locale, key), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return { t, locale, setLocale, locales: LOCALES };
}

/** Locale-aware money and clock formatting for costs, timings and calendars. */
export function fmtNumber(locale: Locale, n: number, digits = 2): string {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function fmtDate(locale: Locale, iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
