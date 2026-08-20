import { useCallback, useEffect, useState } from "react";

export type Theme = "navy" | "pearl";

const KEY = "oos-theme";
const SUITE_MODE_KEY = "sc-mode";
export const CVD_STORAGE_KEY = "oos-cvd";
const CVD_FALLBACK_KEY = "sc-cvd";
const ORDER: Theme[] = ["navy", "pearl"];

export const THEME_LABELS: Record<Theme, string> = {
  navy: "Navy",
  pearl: "Pearl",
};

function readStoredTheme(): string | null {
  try {
    return window.localStorage.getItem(SUITE_MODE_KEY) || window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function resolve(): Theme {
  if (typeof window === "undefined") return "navy";
  const stored = readStoredTheme();
  // dark / ink / avenue / contrast → navy. light / parchment → pearl.
  if (stored === "light" || stored === "pearl" || stored === "parchment") return "pearl";
  if (
    stored === "dark" ||
    stored === "ink" ||
    stored === "avenue" ||
    stored === "navy" ||
    stored === "contrast"
  ) {
    return "navy";
  }
  return "navy";
}

function resolveCvd(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const a = window.localStorage.getItem(CVD_STORAGE_KEY);
    const b = window.localStorage.getItem(CVD_FALLBACK_KEY);
    if (a === "on" || b === "on") return true;
    if (a === "off" || b === "off") return false;
    if (readStoredTheme() === "contrast") return true;
  } catch {
    /* storage unavailable */
  }
  return typeof document !== "undefined" && document.documentElement.classList.contains("cvd");
}

function persistCvd(on: boolean) {
  try {
    const value = on ? "on" : "off";
    window.localStorage.setItem(CVD_STORAGE_KEY, value);
    window.localStorage.setItem(CVD_FALLBACK_KEY, value);
  } catch {
    /* storage unavailable */
  }
}

/**
 * Device-remembered art direction: Navy (default) and Pearl, plus an independent
 * CVD overlay. Legacy Parchment / Ink / Contrast / Avenue keys are mapped in.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("navy");
  const [cvd, setCvdState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = resolve();
    const on = resolveCvd();
    setThemeState(t);
    setCvdState(on);
    if (on) {
      document.documentElement.classList.add("cvd");
      persistCvd(true);
    }
    // Fold leftover "contrast" theme key so CVD stays an overlay, not a ground.
    if (readStoredTheme() === "contrast") {
      try {
        window.localStorage.setItem(KEY, "navy");
        window.localStorage.setItem(SUITE_MODE_KEY, "navy");
      } catch {
        /* storage unavailable */
      }
    }
    setReady(true);
  }, []);

  const apply = useCallback((t: Theme) => {
    const root = document.documentElement;
    root.classList.remove("avenue", "contrast");
    root.classList.toggle("dark", t === "navy");
    root.classList.toggle("light", t === "pearl");
    root.style.colorScheme = t === "navy" ? "dark" : "light";
    try {
      window.localStorage.setItem(KEY, t);
      window.localStorage.setItem(SUITE_MODE_KEY, t);
    } catch {
      /* storage unavailable */
    }
    setThemeState(t);
  }, []);

  const applyCvd = useCallback((on: boolean) => {
    const root = document.documentElement;
    root.classList.remove("contrast");
    root.classList.toggle("cvd", on);
    persistCvd(on);
    setCvdState(on);
  }, []);

  const cycle = useCallback(
    () => apply(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]!),
    [apply, theme],
  );

  return {
    theme,
    ready,
    setTheme: apply,
    cvd,
    setCvd: applyCvd,
    cycle,
    toggle: cycle,
    themes: ORDER,
  };
}
