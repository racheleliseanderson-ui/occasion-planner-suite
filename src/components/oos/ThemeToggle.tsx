import { useTheme } from "@/hooks/use-theme";

/**
 * Parchment / ink switch. Two hairline glyphs in the house mono-and-brass
 * language rather than a generic pill switch.
 */
export function ThemeToggle() {
  const { theme, ready, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to parchment" : "Switch to ink"}
      title={dark ? "Parchment" : "Ink"}
      className="group inline-flex items-stretch border border-border transition-colors hover:border-foreground"
    >
      <span
        className={
          "px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors " +
          (ready && !dark ? "bg-foreground text-background" : "text-muted-foreground")
        }
      >
        Parchment
      </span>
      <span
        className={
          "border-l border-border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors " +
          (ready && dark ? "bg-foreground text-background" : "text-muted-foreground")
        }
      >
        Ink
      </span>
    </button>
  );
}
