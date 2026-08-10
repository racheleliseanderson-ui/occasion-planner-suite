import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const KEY = "oos-theme";

function resolve(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Device-remembered theme. First visit follows the operating system; once the
 * host toggles, that choice wins. The pre-hydration script in __root applies the
 * class before first paint, so there is no flash of the wrong theme.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = resolve();
    setThemeState(t);
    setReady(true);
  }, []);

  const apply = useCallback((t: Theme) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    document.documentElement.style.colorScheme = t;
    try {
      window.localStorage.setItem(KEY, t);
    } catch {
      /* storage unavailable */
    }
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => apply(theme === "dark" ? "light" : "dark"), [apply, theme]);

  return { theme, ready, setTheme: apply, toggle };
}
