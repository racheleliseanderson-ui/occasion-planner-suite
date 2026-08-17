import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { Plan } from "@/lib/oos/types";
import { download, planIcs, planJson, planMarkdown, shoppingCsv, slug, timelineCsv } from "@/lib/oos/export";
import { stashMenu } from "@/lib/oos/handoff";
import {
  MARGIN_SIZES,
  PAGE_SIZES,
  planPdf,
  styleForTheme,
  type MarginSize,
  type PageSize,
  type PdfStyle,
} from "@/lib/oos/pdf";
import { setPrintLayout, useConfig } from "@/lib/oos/store";
import { encodeShare, shareUrl, SAFE_LINK_LENGTH } from "@/lib/oos/share";
import { ENGINE_VERSION, FIXTURE_VERSION, SCHEMA_VERSION } from "@/lib/oos/versions";
import { houseReturnUrl, returnFromPlan } from "@/lib/house/return";
import { HouseReturn } from "./HouseReturn";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import { logError } from "@/lib/oos/log";

const btn =
  "min-h-11 border border-border bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:min-h-11";

/** Everything the host needs to carry the plan out of the browser. */
export function HandoffBar({ plan }: { plan: Plan }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t, locale } = useT();
  const config = useConfig();
  const paper = config.printLayout;
  const today = plan.conditions.eventDate || new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [style, setStyle] = useState<PdfStyle | null>(null);
  const [share, setShare] = useState<{ url: string; long: boolean; copied: boolean } | null>(null);
  const name = slug(plan.conditions.label);
  const pdfStyle = style ?? styleForTheme(theme);

  const PAGE_LABELS: Record<PageSize, string> = { a4: "A4", letter: "Letter", legal: "Legal" };
  const MARGIN_LABELS: Record<MarginSize, string> = {
    narrow: t("ho.paper.narrow"),
    standard: t("ho.paper.standard"),
    wide: t("ho.paper.wide"),
  };

  const seg = (active: boolean, first: boolean) =>
    "min-h-11 px-3 font-mono text-[10px] uppercase tracking-widest transition-colors " +
    (first ? "" : "border-l border-border ") +
    (active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground");

  const STYLE_LABELS: Record<PdfStyle, string> = {
    standard: t("ho.pdf.standard"),
    contrast: t("ho.pdf.contrast"),
    large: t("ho.pdf.large"),
  };


  /** Snapshot dishes travel so a shared link reproduces the sender, not the recipient workshop. */
  const makeLink = async (compact: boolean) => {
    const snapshot = plan.menu.map((m) => m.dish);
    const token = await encodeShare({
      v: 3,
      c: plan.conditions,
      k: plan.conditions.label,
      l: locale,
      m: snapshot.map((d) => d.id),
      signature: plan.signature,
      engineVersion: ENGINE_VERSION,
      fixtureVersion: FIXTURE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      ...(compact ? {} : { d: snapshot }),
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
          <button type="button" className={btn} onClick={() => planPdf(plan, pdfStyle, paper).catch((e) => logError("pdf.packet", e))}>
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
          <button
            type="button"
            className={`${btn} border-foreground`}
            onClick={async () => {
              const snapshot = plan.menu.map((m) => m.dish);
              const token = await encodeShare({
                v: 3,
                c: plan.conditions,
                k: plan.conditions.label,
                l: locale,
                m: snapshot.map((d) => d.id),
                signature: plan.signature,
                engineVersion: ENGINE_VERSION,
                fixtureVersion: FIXTURE_VERSION,
                schemaVersion: SCHEMA_VERSION,
                d: snapshot,
              });
              const reopen = shareUrl(token, locale);
              window.open(houseReturnUrl(returnFromPlan(plan, reopen)), "_blank", "noopener,noreferrer");
            }}
          >
            {t("ho.house")}
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

        {/* Paper: how the packet lands on a real tray */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("ho.paper")}
          </span>
          <div role="group" aria-label={t("ho.paper.page")} className="flex border border-border">
            {PAGE_SIZES.map((size, i) => (
              <button
                key={size}
                type="button"
                aria-pressed={paper.page === size}
                onClick={() => setPrintLayout({ ...paper, page: size })}
                className={seg(paper.page === size, i === 0)}
              >
                {PAGE_LABELS[size]}
              </button>
            ))}
          </div>
          <div role="group" aria-label={t("ho.paper.margin")} className="flex border border-border">
            {MARGIN_SIZES.map((size, i) => (
              <button
                key={size}
                type="button"
                aria-pressed={paper.margin === size}
                onClick={() => setPrintLayout({ ...paper, margin: size })}
                className={seg(paper.margin === size, i === 0)}
              >
                {MARGIN_LABELS[size]}
              </button>
            ))}
          </div>
          <label className="flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <input
              type="checkbox"
              checked={paper.header}
              onChange={(e) => setPrintLayout({ ...paper, header: e.target.checked })}
              className="size-4 accent-[currentColor]"
            />
            {t("ho.paper.header")}
          </label>
          <label className="flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <input
              type="checkbox"
              checked={paper.footer}
              onChange={(e) => setPrintLayout({ ...paper, footer: e.target.checked })}
              className="size-4 accent-[currentColor]"
            />
            {t("ho.paper.footer")}
          </label>
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
              const token = await encodeShare({
                v: 3,
                c: plan.conditions,
                l: locale,
                signature: plan.signature,
                engineVersion: ENGINE_VERSION,
                fixtureVersion: FIXTURE_VERSION,
              });
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
        {t("ho.note")} {t("ho.shareNote")} {t("ho.paper.note")}
      </p>

      <div className="mt-4">
        <HouseReturn payload={returnFromPlan(plan)} compact />
      </div>
    </div>
  );
}
