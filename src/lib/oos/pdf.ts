import type { Plan } from "./types";
import { slug } from "./export";
import type { DecisionRecord } from "./decision";

/**
 * PDF hand-offs, composed in the browser. The generator measures before it
 * places, so a heading never strands at the foot of a page and a table row is
 * never cut in half. Three styles match the on-screen art direction: the house
 * standard, a pure-black high-contrast setting, and a large-font setting for
 * reading across a kitchen.
 */

export type PdfStyle = "standard" | "contrast" | "large";

export const PDF_STYLES: PdfStyle[] = ["standard", "contrast", "large"];

interface StyleSpec {
  /** multiplier applied to every type size */
  scale: number;
  /** grey level for secondary text; 0 = pure black */
  muted: number;
  /** grey level for hairlines */
  rule: number;
  ruleWidth: number;
  /** shopping list columns */
  columns: 1 | 2;
  leading: number;
}

const SPECS: Record<PdfStyle, StyleSpec> = {
  standard: { scale: 1, muted: 110, rule: 170, ruleWidth: 0.2, columns: 2, leading: 1.5 },
  contrast: { scale: 1.04, muted: 0, rule: 0, ruleWidth: 0.5, columns: 2, leading: 1.55 },
  large: { scale: 1.3, muted: 60, rule: 90, ruleWidth: 0.4, columns: 1, leading: 1.7 },
};

/** The screen theme preselects the matching document style. */
export function styleForTheme(theme: string): PdfStyle {
  if (theme === "contrast" || theme === "cvd") return "contrast";
  return "standard";
}

const PAGE = { w: 210, h: 297 } as const; // A4 millimetres
const M = 18;
const FOOT = 14;

/** Real-world print settings, so a packet lands the same on any tray. */
export type PageSize = "a4" | "letter" | "legal";
export type MarginSize = "narrow" | "standard" | "wide";

export interface PrintLayout {
  page: PageSize;
  margin: MarginSize;
  /** running head: occasion, service time and guest count on every page */
  header: boolean;
  /** foot rule with the route signature and "page n of m" */
  footer: boolean;
}

export const PAGE_SIZES: PageSize[] = ["a4", "letter", "legal"];
export const MARGIN_SIZES: MarginSize[] = ["narrow", "standard", "wide"];

/** Trim sizes in millimetres — jsPDF measures in mm throughout this file. */
const PAGE_MM: Record<PageSize, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
  legal: { w: 215.9, h: 355.6 },
};

/** Margins wide enough to clear the unprintable edge on domestic printers. */
const MARGIN_MM: Record<MarginSize, number> = { narrow: 12, standard: 18, wide: 25 };

export const DEFAULT_PRINT_LAYOUT: PrintLayout = {
  page: "a4",
  margin: "standard",
  header: true,
  footer: true,
};

type Doc = import("jspdf").jsPDF;

class Composer {
  y = M;
  readonly pw: number;
  readonly ph: number;
  readonly m: number;
  readonly foot: number;
  constructor(
    readonly doc: Doc,
    readonly s: StyleSpec,
    readonly runningHead: string,
    readonly layout: PrintLayout = DEFAULT_PRINT_LAYOUT,
  ) {
    const trim = PAGE_MM[layout.page];
    this.pw = trim.w;
    this.ph = trim.h;
    this.m = MARGIN_MM[layout.margin];
    // A suppressed footer still keeps a short quiet zone at the foot.
    this.foot = layout.footer ? 14 : 8;
    this.header();
  }

  private header() {
    const d = this.doc;
    if (!this.layout.header) {
      d.setTextColor(20);
      this.y = this.m + 2;
      return;
    }
    d.setFont("courier", "normal").setFontSize(6.5 * this.s.scale).setTextColor(this.s.muted);
    d.text(this.runningHead.toUpperCase(), this.m, this.m - 6, { charSpace: 0.5 });
    d.setDrawColor(this.s.rule)
      .setLineWidth(this.s.ruleWidth)
      .line(this.m, this.m - 4, this.pw - this.m, this.m - 4);
    d.setTextColor(20);
    this.y = this.m + 2;
  }

  get bottom() {
    return this.ph - this.foot - 4;
  }

  /** Start a new page if the next block cannot fit whole. */
  need(height: number) {
    if (this.y + height > this.bottom) {
      this.doc.addPage();
      this.header();
    }
  }

  measure(text: string, size: number, indent = 0): number {
    const d = this.doc;
    d.setFont("times", "normal").setFontSize(size * this.s.scale);
    const lines = d.splitTextToSize(text, this.pw - this.m * 2 - indent) as string[];
    return lines.length * size * this.s.scale * 0.52 + this.s.leading;
  }

  /** Wrapped body text. Breaks between lines only when a block is genuinely long. */
  body(text: string, size = 10, indent = 0, muted = false) {
    const d = this.doc;
    const px = size * this.s.scale;
    d.setFont("times", "normal").setFontSize(px).setTextColor(muted ? this.s.muted : 20);
    const lines = d.splitTextToSize(text, this.pw - this.m * 2 - indent) as string[];
    for (const line of lines) {
      if (this.y + px * 0.52 > this.bottom) {
        d.addPage();
        this.header();
        d.setFont("times", "normal").setFontSize(px).setTextColor(muted ? this.s.muted : 20);
      }
      d.text(line, this.m + indent, this.y);
      this.y += px * 0.52;
    }
    this.y += this.s.leading;
  }

  /** A row with a right-aligned figure column, kept whole. */
  row(left: string, right: string, size = 9.5, indent = 0, box = false) {
    const d = this.doc;
    const px = size * this.s.scale;
    const rightW = d.getTextWidth(right) + 4;
    const pad = box ? px * 0.55 : 0;
    d.setFont("times", "normal").setFontSize(px);
    const lines = d.splitTextToSize(left, this.pw - this.m * 2 - indent - pad - rightW) as string[];
    this.need(lines.length * px * 0.52 + 1);
    d.setTextColor(20);
    if (box) {
      // A real drawn box: the tick glyph is absent from the core PDF fonts.
      const b = px * 0.32;
      d.setDrawColor(this.s.rule === 0 ? 0 : 120)
        .setLineWidth(this.s.ruleWidth)
        .rect(this.m + indent, this.y - b, b, b);
    }
    lines.forEach((line, i) => {
      d.text(line, this.m + indent + pad, this.y + i * px * 0.52);
    });
    d.setFont("courier", "normal").setFontSize(px * 0.86).setTextColor(this.s.muted);
    d.text(right, this.pw - this.m, this.y, { align: "right" });
    d.setTextColor(20);
    this.y += lines.length * px * 0.52 + 1;
  }

  /** Small-caps section label. Never left orphaned: it reserves room beneath. */
  label(text: string, reserve = 20) {
    this.need(reserve + 8);
    const d = this.doc;
    d.setFont("courier", "normal").setFontSize(6.8 * this.s.scale).setTextColor(this.s.muted);
    d.text(text.toUpperCase(), this.m, this.y, { charSpace: 0.6 });
    d.setTextColor(20);
    this.y += 4 * this.s.scale;
  }

  heading(text: string, size = 16) {
    this.need(size * this.s.scale + 6);
    const d = this.doc;
    d.setFont("times", "normal").setFontSize(size * this.s.scale).setTextColor(20);
    // Leave room for the ascender so a large title never rides up into the label above it.
    this.y += size * this.s.scale * 0.42;
    d.text(text, this.m, this.y);
    this.y += size * this.s.scale * 0.5;
  }

  rule() {
    this.need(6);
    this.doc
      .setDrawColor(this.s.rule)
      .setLineWidth(this.s.ruleWidth)
      .line(this.m, this.y, this.pw - this.m, this.y);
    this.y += 5;
  }

  newPage() {
    this.doc.addPage();
    this.header();
  }

  gap(mm = 3) {
    this.y += mm;
  }

  /** Page n of m, stamped once the document is fully composed. */
  finish(note: string) {
    if (!this.layout.footer) return;
    const d = this.doc;
    const total = d.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      d.setPage(p);
      d.setDrawColor(this.s.rule).setLineWidth(this.s.ruleWidth).line(this.m, this.ph - this.foot, this.pw - this.m, this.ph - this.foot);
      d.setFont("courier", "normal").setFontSize(6.5 * this.s.scale).setTextColor(this.s.muted);
      d.text(note.toUpperCase(), this.m, this.ph - this.foot + 5, { charSpace: 0.4 });
      d.text(`PAGE ${p} OF ${total}`, this.pw - this.m, this.ph - this.foot + 5, { align: "right", charSpace: 0.4 });
    }
  }
}

function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

/** The full working packet: conditions, verdict, menu, load, clock, shopping. */
export async function planPdf(
  plan: Plan,
  style: PdfStyle = "standard",
  layout: PrintLayout = DEFAULT_PRINT_LAYOUT,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: layout.page });
  const spec = SPECS[style];
  const c = plan.conditions;
  const k = new Composer(doc, spec, `${c.label} · service ${c.serviceTime} · ${c.guests} guests`, layout);

  k.label("Occasion Operating System · Salty & Clever");
  k.heading(c.label, 22);
  k.gap(1);
  k.body(
    `${c.guests} guests · ${c.style} ${c.shape} · service at ${c.serviceTime} · ${c.prepWindowH}h day-of window · ${c.helpers} helper${c.helpers === 1 ? "" : "s"} · ${c.season}`,
    10,
  );
  k.rule();

  k.label("Verdict");
  k.body(
    `Feasibility ${plan.feasibility}/100 — ${plan.verdict}. Balance ${plan.balance}/100. Indicative cost ${plan.costPerHead.toFixed(2)} per head against a ceiling of ${plan.costCeiling}. Hands-on ${fmt(plan.handsOnMin)}. ${Math.round(plan.makeAheadShare * 100)}% of the route is made before the day.`,
  );

  if (plan.stops.length) {
    k.rule();
    k.label("Hard stops");
    for (const s of plan.stops) {
      k.need(k.measure(`${s.code} — ${s.title}`, 11) + k.measure(`${s.detail} Correction: ${s.correction}`, 9.5, 4));
      k.body(`${s.code} — ${s.title}`, 11);
      k.body(`${s.detail} Correction: ${s.correction}`, 9.5, 4, true);
    }
  }

  k.rule();
  k.label("Menu");
  for (const m of plan.menu) {
    const head = `${m.dish.name}  ·  ${m.dish.course}`;
    const note = m.dish.note;
    const wine = m.dish.winePairing;
    const left = plan.conditions.leftovers !== "none" ? m.dish.leftoverNote : undefined;
    k.need(
      k.measure(head, 11) +
        (note ? k.measure(note, 9.5, 4) : 0) +
        (wine ? k.measure(`Wine: ${wine}`, 9, 4) : 0) +
        (left ? k.measure(`Leftovers: ${left}`, 9, 4) : 0),
    );
    k.row(head, `${m.batches}×  serves ${m.serves}`, 11);
    if (note) k.body(note, 9.5, 4, true);
    if (m.dish.pairingWhy) k.body(m.dish.pairingWhy, 8.5, 4, true);
    if (wine) k.body(`Wine / drink: ${wine}`, 9, 4, true);
    if (left) k.body(`Leftover route: ${left}`, 9, 4, true);
  }

  k.rule();
  k.label("Load against declared capacity");
  for (const g of plan.gauges) {
    k.row(`${g.name} — ${g.label}`, `${g.used}/${g.capacity} ${g.unit}  ${g.pct > 400 ? "—" : `${g.pct}%`}`, 9.5);
  }

  k.rule();
  k.label("Prep clock", 34);
  let phase = "";
  for (const t of [...plan.timeline, ...plan.service]) {
    if (t.phase !== phase) {
      phase = t.phase;
      k.gap(2);
      k.label(phase, 26);
    }
    const detail = t.dish ? `${t.dish} · ${t.minutes} min · ${t.resource}` : "";
    k.need(k.measure(t.task, 9.5, 22) + (detail ? k.measure(detail, 8.5, 22) : 0));
    k.row(`${t.clock}    ${t.task}`, t.owner ?? "", 9.5);
    if (detail) k.body(detail, 8.5, 22, true);
  }

  k.newPage();
  k.label("Shopping list", 30);
  let aisle = "";
  if (spec.columns === 2) {
    // Two measured columns, aisle by aisle, so the list never splits a heading.
    for (const line of plan.shopping) {
      if (line.aisle !== aisle) {
        aisle = line.aisle;
        k.gap(2);
        k.label(aisle, 24);
      }
      k.row(line.item, `${line.qty}${line.unit ? ` ${line.unit}` : ""}`, 9.5, 4, true);
    }
  } else {
    for (const line of plan.shopping) {
      if (line.aisle !== aisle) {
        aisle = line.aisle;
        k.gap(3);
        k.label(aisle, 26);
      }
      k.row(line.item, `${line.qty}${line.unit ? ` ${line.unit}` : ""}`, 11, 4, true);
    }
  }

  k.rule();
  k.body(
    "Planning aid only. Dietary categories are filters, not allergen guarantees: confirm every label and every supplier yourself. Costs are indicative, not quotes.",
    8.5,
    0,
    true,
  );

  k.finish(`${plan.signature} · ${c.label}`);
  doc.save(`${slug(c.label)}-packet.pdf`);
}

export interface MenuCard {
  title: string;
  subtitle: string;
  footer: string;
  items: { name: string; note: string; course?: string | undefined }[];
}

/** A centred, typographic card for the table. Overflows onto a second page rather than truncating. */
export async function menuCardPdf(
  card: MenuCard,
  size: "a4" | "a5" = "a5",
  style: PdfStyle = "standard",
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: size });
  const spec = SPECS[style];
  const w = size === "a5" ? 148 : 210;
  const h = size === "a5" ? 210 : 297;
  const cx = w / 2;
  const inner = w - 36;

  const frame = () => {
    doc.setDrawColor(spec.rule).setLineWidth(spec.ruleWidth + 0.1).rect(9, 9, w - 18, h - 18);
  };
  frame();

  let y = 32;
  doc.setFont("courier", "normal").setFontSize(7 * spec.scale).setTextColor(spec.muted);
  doc.text(card.subtitle.toUpperCase(), cx, y, { align: "center", charSpace: 0.7 });
  y += 10;

  doc.setFont("times", "normal").setFontSize(22 * spec.scale).setTextColor(20);
  for (const line of doc.splitTextToSize(card.title, inner) as string[]) {
    doc.text(line, cx, y, { align: "center" });
    y += 10 * spec.scale;
  }

  doc.setDrawColor(spec.rule).setLineWidth(spec.ruleWidth).line(cx - 12, y, cx + 12, y);
  y += 12;

  const nextPage = () => {
    doc.addPage();
    frame();
    y = 28;
  };

  for (const item of card.items) {
    const nameLines = (doc.splitTextToSize(item.name, inner) as string[]).length;
    const noteLines = item.note ? (doc.splitTextToSize(item.note, inner - 10) as string[]).length : 0;
    const block = (item.course ? 5 : 0) + nameLines * 6 * spec.scale + noteLines * 4.4 * spec.scale + 6;
    if (y + block > h - 26) nextPage();

    if (item.course) {
      doc.setFont("courier", "normal").setFontSize(6.5 * spec.scale).setTextColor(spec.muted);
      doc.text(item.course.toUpperCase(), cx, y, { align: "center", charSpace: 0.6 });
      y += 5;
    }
    doc.setFont("times", "normal").setFontSize(13 * spec.scale).setTextColor(20);
    for (const line of doc.splitTextToSize(item.name, inner) as string[]) {
      doc.text(line, cx, y, { align: "center" });
      y += 6 * spec.scale;
    }
    if (item.note) {
      doc.setFont("times", "italic").setFontSize(9 * spec.scale).setTextColor(spec.muted);
      for (const line of doc.splitTextToSize(item.note, inner - 10) as string[]) {
        doc.text(line, cx, y, { align: "center" });
        y += 4.4 * spec.scale;
      }
    }
    y += 6;
  }

  if (card.footer) {
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setFont("courier", "normal").setFontSize(6.5 * spec.scale).setTextColor(spec.muted);
      doc.text(card.footer.toUpperCase(), cx, h - 18, { align: "center", charSpace: 0.6 });
    }
  }

  doc.save(`${slug(card.title || "menu")}-card.pdf`);
}


/** The decision packet: why this route, what binds it, what would change it. */
export async function decisionPdf(
  d: DecisionRecord,
  style: PdfStyle = "standard",
  layout: PrintLayout = DEFAULT_PRINT_LAYOUT,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: layout.page });
  const spec = SPECS[style];
  const k = new Composer(doc, spec, `Decision packet · ${d.label} · ${d.signature}`, layout);

  k.label("Decision packet · Salty & Clever");
  k.heading(d.label, 22);
  k.gap(1);
  k.body(`Verdict ${d.verdict} · feasibility ${d.feasibility}/100 · balance ${d.balance}/100`, 10);
  k.rule();

  k.label("Why");
  k.body(d.why);

  if (d.binding) {
    k.rule();
    k.label("Binding constraint");
    k.row(d.binding.name, `${d.binding.used}/${d.binding.capacity} ${d.binding.unit}  ${d.binding.pct}%`, 11);
    k.body(d.binding.margin, 9.5, 4, true);
  }

  if (d.stops.length) {
    k.rule();
    k.label("Hard stops");
    for (const s of d.stops) {
      k.need(k.measure(`${s.code} — ${s.title}`, 11) + k.measure(s.correction, 9.5, 4));
      k.body(`${s.code} — ${s.title}`, 11);
      k.body(`Correction: ${s.correction}`, 9.5, 4, true);
    }
  }

  k.rule();
  k.label("Assumptions this rests on");
  for (const a of d.assumptions) k.row(a.label, a.value, 9.5);

  k.rule();
  k.label("What would change the verdict", 34);
  for (const l of d.levers) {
    k.need(k.measure(l.label, 11) + k.measure(l.change, 9.5, 4));
    k.row(l.label, `${l.feasibility}/100  ${l.delta >= 0 ? "+" : ""}${l.delta}  ${l.stops} stops`, 11);
    k.body(l.change, 9.5, 4, true);
  }

  k.rule();
  k.label("Accepted by proceeding");
  for (const a of d.accepted) k.body(`— ${a}`, 9.5, 4);

  k.rule();
  k.body(
    "Educational planning record. Dietary categories are planning filters, not allergen guarantees. Costs are indicative, not quotes.",
    8.5,
    0,
    true,
  );

  k.finish(`${d.signature} · ${d.label}`);
  doc.save(`${slug(d.label)}-decision.pdf`);
}
