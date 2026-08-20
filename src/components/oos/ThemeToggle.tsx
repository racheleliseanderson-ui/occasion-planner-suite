import { THEME_LABELS, useTheme, type Theme } from "@/hooks/use-theme";

const SHORT: Record<Theme, string> = {
  navy: "Navy",
  pearl: "Pearl",
};

const btn =
  "min-h-11 px-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:min-h-9 ";

/** Navy · Pearl (exclusive) + independent CVD overlay. */
export function ThemeToggle() {
  const { theme, ready, setTheme, themes, cvd, setCvd } = useTheme();

  return (
    <div className="inline-flex items-stretch gap-1">
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
                btn +
                (i > 0 ? "border-l border-border " : "") +
                (on ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
              }
            >
              {SHORT[t]}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setCvd(!cvd)}
        aria-pressed={ready && cvd}
        title="Colour-vision-safe palette (brass / cyan)"
        className={
          btn +
          "border border-border " +
          (ready && cvd
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground")
        }
      >
        CVD
      </button>
    </div>
  );
}
