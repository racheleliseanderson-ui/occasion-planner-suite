import { THEME_LABELS, useTheme, type Theme } from "@/hooks/use-theme";

const SHORT: Record<Theme, string> = { light: "Parchment", dark: "Ink", contrast: "Contrast" };

/**
 * Three art directions in the house mono-and-hairline language: parchment, ink,
 * and a colour-blind-safe high-contrast field. No generic pill switch.
 */
export function ThemeToggle() {
  const { theme, ready, setTheme, themes } = useTheme();

  return (
    <div
      role="group"
      aria-label="Visual theme"
      className="inline-flex items-stretch border border-border"
    >
      {themes.map((t, i) => {
        const on = ready && theme === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            aria-pressed={on}
            title={THEME_LABELS[t]}
            className={
              "min-h-11 px-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:min-h-9 " +
              (i > 0 ? "border-l border-border " : "") +
              (on ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
            }
          >
            {SHORT[t]}
          </button>
        );
      })}
    </div>
  );
}
