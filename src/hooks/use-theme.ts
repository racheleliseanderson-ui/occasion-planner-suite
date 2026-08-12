import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "contrast";

const KEY = "oos-theme";
const ORDER: Theme[] = ["light", "dark", "contrast"];

export const THEME_LABELS: Record<Theme, string> = {
  light: "Parchment",
  dark: "Ink",
  contrast: "High contrast",
};

function resolve(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(KEY);
    // Avenue removed — fold prior selections into Ink.
    if (stored === "avenue" || stored === "dark") return "dark";
    if (stored === "light" || stored === "contrast") return stored;
  } catch {
    /* storage unavailable */
  }
  if (window.matchMedia("(prefers-contrast: more)").matches) return "contrast";
  return "dark";
}

/**
 * Device-remembered art direction: Parchment, Ink, Contrast.
 * Avenue is no longer offered.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(resolve());
    setReady(true);
  }, []);

  const apply = useCallback((t: Theme) => {
    const root = document.documentElement;
    root.classList.remove("avenue");
    root.classList.toggle("dark", t === "dark");
    root.classList.toggle("contrast", t === "contrast");
    root.style.colorScheme = t === "dark" ? "dark" : "light";
    try {
      window.localStorage.setItem(KEY, t);
    } catch {
      /* storage unavailable */
    }
    setThemeState(t);
  }, []);

  const cycle = useCallback(
    () => apply(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]!),
    [apply, theme],
  );

  return { theme, ready, setTheme: apply, cycle, toggle: cycle, themes: ORDER };
}
