import { useCallback, useEffect, useState } from "react";

export type Theme = "avenue" | "light" | "dark" | "contrast";

const KEY = "oos-theme";
const ORDER: Theme[] = ["avenue", "light", "dark", "contrast"];

export const THEME_LABELS: Record<Theme, string> = {
  avenue: "Avenue",
  light: "Parchment",
  dark: "Ink",
  contrast: "High contrast",
};

function resolve(): Theme {
  if (typeof window === "undefined") return "avenue";
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "avenue" || stored === "light" || stored === "dark" || stored === "contrast") return stored;
  } catch {
    /* storage unavailable */
  }
  // A declared contrast preference always wins over the house default.
  if (window.matchMedia("(prefers-contrast: more)").matches) return "contrast";
  return "avenue";
}

/**
 * Device-remembered art direction. First visit follows the operating system —
 * including a declared contrast preference; once the host chooses, that wins.
 * The pre-hydration script in __root applies the class before first paint.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("avenue");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(resolve());
    setReady(true);
  }, []);

  const apply = useCallback((t: Theme) => {
    const root = document.documentElement;
    root.classList.toggle("dark", t === "dark");
    root.classList.toggle("contrast", t === "contrast");
    root.classList.toggle("avenue", t === "avenue");
    root.style.colorScheme = t === "dark" || t === "avenue" ? "dark" : "light";
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
