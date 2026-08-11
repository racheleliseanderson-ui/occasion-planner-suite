import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { Plan } from "@/lib/oos/types";
import { download, planIcs, planJson, planMarkdown, shoppingCsv, slug, timelineCsv } from "@/lib/oos/export";
import { stashMenu } from "@/lib/oos/handoff";
import { planPdf, styleForTheme, type PdfStyle } from "@/lib/oos/pdf";
import { encodeShare, shareUrl, SAFE_LINK_LENGTH } from "@/lib/oos/share";
import { FIXTURE_IDS } from "@/lib/oos/library";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";

const btn =
  "min-h-11 border border-border bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:min-h-11";

/** Everything the host needs to carry the plan out of the browser. */
export function HandoffBar({ plan }: { plan: Plan }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t, locale } = useT();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [style, setStyle] = useState<PdfStyle | null>(null);
  const [share, setShare] = useState<{ url: string; long: boolean; copied: boolean } | null>(null);
  const name = slug(plan.conditions.label);
  const pdfStyle = style ?? styleForTheme(theme);

  const STYLE_LABELS: Record<PdfStyle, string> = {
    standard: t("ho.pdf.standard"),
    contrast: t("ho.pdf.contrast"),
    large: t("ho.pdf.large"),
    avenue: t("ho.pdf.avenue"),
  };


  /** Only the dishes the route depends on that differ from the shipped fixtures travel in the link. */
  const changedDishes = plan.menu
    .map((m) => m.dish)
    .filter((d) => !FIXTURE_IDS.has(d.id));

  const makeLink = async (compact: boolean) => {
    const token = await encodeShare({
      v: 2,
      c: plan.conditions,
      k: plan.conditions.label,
      l: locale,
      ...(compact || changedDishes.length === 0 ? {} : { d: changedDishes }),
    });
    const url = shareUrl(token, locale);
    let copied = false;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch {
      /* clipboard blocked — the address is shown for manual copying */
    }
    setShare({ url, long: url.length > SAFE_LINK_LENGTH, copied });
  };

  return (
    <div className="no-print border border-border bg-secondary px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="rule-label">{t("ho.title")}</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={() => download(`${name}-packet.md`, "text/markdown", planMarkdown(plan))}>
            {t("ho.md")}
          </button>
          <button type="button" className={btn} onClick={() => download(`${name}-shopping.csv`, "text/csv", shoppingCsv(plan))}>
            {t("ho.shopping")}
          </button>
          <button type="button" className={btn} onClick={() => download(`${name}-prep-clock.csv`, "text/csv", timelineCsv(plan))}>
            {t("ho.clock")}
          </button>
          <button type="button" className={btn} onClick={() => download(`${name}-plan.json`, "application/json", planJson(plan))}>
            {t("ho.json")}
          </button>
          <button type="button" className={btn} onClick={() => planPdf(plan, pdfStyle)}>
            {t("ho.pdf")}
          </button>
          <button type="button" className={btn} onClick={() => window.print()}>
            {t("action.print")}
          </button>
          <button
            type="button"
            className={`${btn} border-foreground`}
            onClick={() => {
              stashMenu(plan);
              navigate({ to: "/menu" });
            }}
          >
            {t("ho.menuBuilder")}
          </button>
        </div>

        {/* PDF style, preselected from the screen theme */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("ho.pdfStyle")}
          </span>
          <div role="group" aria-label={t("ho.pdfStyle")} className="flex border border-border">
            {(Object.keys(STYLE_LABELS) as PdfStyle[]).map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                aria-pressed={pdfStyle === s}
                className={
                  "min-h-11 px-3 font-mono text-[10px] uppercase tracking-widest transition-colors " +
                  (i > 0 ? "border-l border-border " : "") +
                  (pdfStyle === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
                }
              >
                {STYLE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground" htmlFor="oos-ics-date">
            {t("ho.date")}
          </label>
          <input
            id="oos-ics-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-11 border border-border bg-card px-2 py-1.5 font-mono text-xs"
          />
          <button
            type="button"
            className={btn}
            onClick={() => download(`${name}-prep.ics`, "text/calendar", planIcs(plan, date))}
          >
            {t("ho.ics")}
          </button>
        </div>

        {/* Shareable read-only link */}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={`${btn} border-foreground`} onClick={() => makeLink(false)}>
            {t("ho.share")}
          </button>
          <button type="button" className={btn} onClick={() => makeLink(true)}>
            {t("ho.shareCompact")}
          </button>
          <button
            type="button"
            className={btn}
            onClick={async () => {
              const token = await encodeShare({ v: 2, c: plan.conditions, l: locale });
              download(`${name}-share.txt`, "text/plain", shareUrl(token, locale));
            }}
          >
            {t("ho.shareFile")}
          </button>
        </div>
      </div>

      {share && (
        <div role="status" className="mt-3 border-l-2 border-accent pl-3 text-xs leading-relaxed">
          {share.copied && <p>{t("ho.shareCopied")}</p>}
          <p className="font-mono text-[10px] text-muted-foreground">
            {t("ho.shareSize")}: {share.url.length}
          </p>
          {share.long && <p className="mt-1 text-signal-over">{t("ho.shareLong")}</p>}
          <textarea
            readOnly
            value={share.url}
            rows={2}
            className="mt-2 w-full border border-border bg-card p-2 font-mono text-[10px]"
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      )}

      <p className="mt-3 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
        {t("ho.note")} {t("ho.shareNote")}
      </p>
    </div>
  );
}
