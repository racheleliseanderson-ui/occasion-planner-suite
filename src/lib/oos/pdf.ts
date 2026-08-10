import type { Plan } from "./types";
import { slug } from "./export";

/**
 * PDF hand-offs, generated in the browser. Two documents: the working packet a
 * host cooks from, and a typographic menu card for the table. Both are laid out
 * in the house language — hairline rules, small caps labels, generous leading —
 * rather than dumped from the screen.
 */

const PAGE = { w: 210, h: 297 } as const; // A4 millimetres
const M = 20;

type Doc = import("jspdf").jsPDF;

async function newDoc(): Promise<Doc> {
  const { jsPDF } = await import("jspdf");
  return new jsPDF({ unit: "mm", format: "a4" });
}

function label(doc: Doc, text: string, y: number) {
  doc.setFont("courier", "normal").setFontSize(7).setTextColor(110);
  doc.text(text.toUpperCase(), M, y, { charSpace: 0.6 });
  doc.setTextColor(20);
  return y + 4;
}

function rule(doc: Doc, y: number) {
  doc.setDrawColor(170).setLineWidth(0.2).line(M, y, PAGE.w - M, y);
  return y + 5;
}

/** Wrapped body text with an automatic page break. */
function body(doc: Doc, text: string, y: number, size = 10, indent = 0): number {
  doc.setFont("times", "normal").setFontSize(size).setTextColor(20);
  const lines = doc.splitTextToSize(text, PAGE.w - M * 2 - indent) as string[];
  let cursor = y;
  for (const line of lines) {
    if (cursor > PAGE.h - M) {
      doc.addPage();
      cursor = M;
    }
    doc.text(line, M + indent, cursor);
    cursor += size * 0.52;
  }
  return cursor + 1.5;
}

function heading(doc: Doc, text: string, y: number, size = 16): number {
  let cursor = y;
  if (cursor > PAGE.h - M - 20) {
    doc.addPage();
    cursor = M;
  }
  doc.setFont("times", "normal").setFontSize(size).setTextColor(20);
  doc.text(text, M, cursor);
  return cursor + size * 0.5;
}

function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

/** The full working packet: conditions, verdict, menu, load, clock, shopping. */
export async function planPdf(plan: Plan): Promise<void> {
  const doc = await newDoc();
  const c = plan.conditions;
  let y = M;

  y = label(doc, "Occasion Operating System · Salty & Clever", y);
  y = heading(doc, c.label, y + 2, 22);
  y += 2;
  y = body(
    doc,
    `${c.guests} guests · ${c.style} ${c.shape} · service at ${c.serviceTime} · ${c.prepWindowH}h day-of window · ${c.helpers} helper${c.helpers === 1 ? "" : "s"} · ${c.season}`,
    y,
    10,
  );
  y = rule(doc, y + 1);

  y = label(doc, "Verdict", y);
  y = body(
    doc,
    `Feasibility ${plan.feasibility}/100 — ${plan.verdict}. Balance ${plan.balance}/100. Indicative cost ${plan.costPerHead.toFixed(2)} per head against a ceiling of ${plan.costCeiling}. Hands-on ${fmt(plan.handsOnMin)}. ${Math.round(plan.makeAheadShare * 100)}% of the route is made before the day.`,
    y,
  );

  if (plan.stops.length) {
    y = rule(doc, y);
    y = label(doc, "Hard stops", y);
    for (const s of plan.stops) {
      y = body(doc, `${s.code} — ${s.title}`, y, 11);
      y = body(doc, `${s.detail} Correction: ${s.correction}`, y, 9.5, 4);
    }
  }

  y = rule(doc, y);
  y = label(doc, "Menu", y);
  for (const m of plan.menu) {
    y = body(doc, `${m.dish.name}  ·  ${m.dish.course}  ·  ${m.batches} batch${m.batches === 1 ? "" : "es"}`, y, 11);
    if (m.dish.note) y = body(doc, m.dish.note, y, 9.5, 4);
  }

  y = rule(doc, y);
  y = label(doc, "Load against declared capacity", y);
  for (const g of plan.gauges) {
    y = body(doc, `${g.name}: ${g.used} of ${g.capacity} ${g.unit} — ${g.pct}% (${g.label})`, y, 9.5);
  }

  y = rule(doc, y);
  y = label(doc, "Prep clock", y);
  for (const t of [...plan.timeline, ...plan.service]) {
    y = body(doc, `${t.phase}  ${t.clock}  ${t.task}${t.owner ? `  [${t.owner}]` : ""}`, y, 9.5);
    if (t.dish) y = body(doc, `${t.dish} · ${t.minutes} min · ${t.resource}`, y, 8.5, 6);

  }

  doc.addPage();
  y = M;
  y = label(doc, "Shopping list", y);
  let aisle = "";
  for (const line of plan.shopping) {
    if (line.aisle !== aisle) {
      aisle = line.aisle;
      y = body(doc, aisle.toUpperCase(), y + 1, 9);
    }
    y = body(doc, `☐  ${line.item} — ${line.qty}${line.unit ? ` ${line.unit}` : ""}`, y, 9.5, 4);
  }

  y = rule(doc, y + 2);
  y = body(
    doc,
    "Planning aid only. Dietary categories are filters, not allergen guarantees: confirm every label and every supplier yourself. Costs are indicative, not quotes.",
    y,
    8.5,
  );

  doc.save(`${slug(c.label)}-packet.pdf`);
}

export interface MenuCard {
  title: string;
  subtitle: string;
  footer: string;
  items: { name: string; note: string; course?: string }[];
}

/** A centred, typographic card for the table. One page, no chrome. */
export async function menuCardPdf(card: MenuCard, size: "a4" | "a5" = "a5"): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: size });
  const w = size === "a5" ? 148 : 210;
  const h = size === "a5" ? 210 : 297;
  const cx = w / 2;
  const inner = w - 36;

  doc.setDrawColor(150).setLineWidth(0.3).rect(9, 9, w - 18, h - 18);

  let y = 32;
  doc.setFont("courier", "normal").setFontSize(7).setTextColor(110);
  doc.text(card.subtitle.toUpperCase(), cx, y, { align: "center", charSpace: 0.7 });
  y += 10;

  doc.setFont("times", "normal").setFontSize(22).setTextColor(20);
  for (const line of doc.splitTextToSize(card.title, inner) as string[]) {
    doc.text(line, cx, y, { align: "center" });
    y += 10;
  }

  doc.setDrawColor(170).line(cx - 12, y, cx + 12, y);
  y += 12;

  for (const item of card.items) {
    if (y > h - 34) break;
    if (item.course) {
      doc.setFont("courier", "normal").setFontSize(6.5).setTextColor(130);
      doc.text(item.course.toUpperCase(), cx, y, { align: "center", charSpace: 0.6 });
      y += 5;
    }
    doc.setFont("times", "normal").setFontSize(13).setTextColor(20);
    for (const line of doc.splitTextToSize(item.name, inner) as string[]) {
      doc.text(line, cx, y, { align: "center" });
      y += 6;
    }
    if (item.note) {
      doc.setFont("times", "italic").setFontSize(9).setTextColor(105);
      for (const line of doc.splitTextToSize(item.note, inner - 10) as string[]) {
        doc.text(line, cx, y, { align: "center" });
        y += 4.4;
      }
    }
    y += 6;
  }

  if (card.footer) {
    doc.setFont("courier", "normal").setFontSize(6.5).setTextColor(130);
    doc.text(card.footer.toUpperCase(), cx, h - 18, { align: "center", charSpace: 0.6 });
  }

  doc.save(`${slug(card.title || "menu")}-card.pdf`);
}
