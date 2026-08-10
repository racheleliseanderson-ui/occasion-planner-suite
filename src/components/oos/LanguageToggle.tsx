import { LOCALE_LABELS, LOCALE_SHORT, useT } from "@/lib/i18n";

/** Language selector in the same hairline language as the theme switch. */
export function LanguageToggle() {
  const { locale, setLocale, locales, t } = useT();

  return (
    <div role="group" aria-label={t("lang.label")} className="inline-flex items-stretch border border-border">
      {locales.map((l, i) => {
        const on = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={on}
            title={LOCALE_LABELS[l]}
            className={
              "min-h-11 px-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:min-h-9 " +
              (i > 0 ? "border-l border-border " : "") +
              (on ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
            }
          >
            {LOCALE_SHORT[l]}
          </button>
        );
      })}
    </div>
  );
}
