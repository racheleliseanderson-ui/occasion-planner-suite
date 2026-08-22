/**
 * App → website return contract.
 * Architecture/Plan/Card can hand a brief back to saltnotes.blog.
 * No guest names, emails, medical detail, or payment data. Ever.
 */
import { z } from "zod";
import type { Plan } from "@/lib/oos/types";
import type { MenuBuilderInput, MenuBuilderResult } from "@/lib/architecture/types";
import {
  HOUSE_ORIGIN,
  READING_DESK_URL,
  matchReading,
  type ReadingKind,
  type ReadingPiece,
} from "./atlas";

export const HOUSE_RETURN_MESSAGE = "salty:house-return";
export const HOUSE_RETURN_VERSION = "1.0.0";
export const HOUSE_RETURN_HASH = "sc";

const PROHIBITED = new Set([
  "guestNames",
  "emailAddresses",
  "medicalHistory",
  "exactAllergySafetyConclusion",
  "paymentData",
  "currentPriceGuarantees",
]);

const readingKindSchema = z.enum(["house", "hosting", "recipe", "drink", "essay", "menu"]);

const readingLineSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  kind: readingKindSchema,
});

const dishLineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  course: z.string().optional(),
});

export const houseReturnSchema = z.object({
  v: z.literal(HOUSE_RETURN_VERSION),
  from: z.enum(["plan", "architecture", "card", "library", "venue", "restaurant"]),
  label: z.string().min(1),
  thesis: z.string().default(""),
  guests: z.number().int().positive(),
  seatingKnown: z.boolean().default(true),
  seatingCount: z.number().int().nonnegative().nullable().optional(),
  dishes: z.array(dishLineSchema).max(12),
  reading: z.array(readingLineSchema).min(1).max(8),
  reopen: z.string().url().optional(),
  signature: z.string().min(1),
  createdAt: z.string().min(1),
});

export type HouseReturnPayload = z.infer<typeof houseReturnSchema>;

export type HouseReturnSource = HouseReturnPayload["from"];

function inspectKeys(value: unknown, found: string[]) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (PROHIBITED.has(key)) found.push(key);
    if (child && typeof child === "object") inspectKeys(child, found);
  }
}

export function validateHouseReturn(value: unknown): { valid: true; payload: HouseReturnPayload } | { valid: false; errors: string[] } {
  const found: string[] = [];
  inspectKeys(value, found);
  if (found.length) {
    return { valid: false, errors: [`Prohibited return fields found: ${[...new Set(found)].join(", ")}.`] };
  }
  const parsed = houseReturnSchema.safeParse(value);
  if (!parsed.success) {
    return { valid: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }
  if (parsed.data.seatingKnown === false && parsed.data.seatingCount != null) {
    return { valid: false, errors: ["Unknown seating cannot carry a seat count."] };
  }
  for (const piece of parsed.data.reading) {
    if (!piece.url.startsWith(`${HOUSE_ORIGIN}/`)) {
      return { valid: false, errors: ["Reading list may only point at saltnotes.blog."] };
    }
  }
  return { valid: true, payload: parsed.data };
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(out);
}

export function encodeHouseReturn(payload: HouseReturnPayload): string {
  const check = validateHouseReturn(payload);
  if (!check.valid) throw new Error(check.errors.join(" "));
  return `j.${toBase64Url(JSON.stringify(check.payload))}`;
}

export function decodeHouseReturn(token: string): HouseReturnPayload | null {
  try {
    if (!token.startsWith("j.")) return null;
    const parsed = JSON.parse(fromBase64Url(token.slice(2)));
    const check = validateHouseReturn(parsed);
    return check.valid ? check.payload : null;
  } catch {
    return null;
  }
}

export function houseReturnUrl(payload: HouseReturnPayload): string {
  return `${READING_DESK_URL}#${HOUSE_RETURN_HASH}=${encodeHouseReturn(payload)}`;
}

function compactReading(pieces: ReadingPiece[]) {
  return pieces.map((piece) => ({ title: piece.title, url: piece.url, kind: piece.kind as ReadingKind }));
}

export function returnFromPlan(plan: Plan, reopen?: string): HouseReturnPayload {
  const dishes = plan.menu.slice(0, 12).map((row) => ({
    id: row.dish.id,
    name: row.dish.name,
    course: row.dish.course,
  }));
  const reading = compactReading(
    matchReading({
      dishIds: dishes.map((d) => d.id),
      names: dishes.map((d) => d.name),
      courses: dishes.map((d) => d.course),
      shapes: [plan.conditions.shape],
      occasion: plan.conditions.label,
      beverage: plan.conditions.diets.includes("no-alcohol") ? "zero_proof" : "both",
      serviceStyle: plan.conditions.style,
      locked: Boolean(plan.conditions.lockedMenu),
    }),
  );
  const payload: HouseReturnPayload = {
    v: HOUSE_RETURN_VERSION,
    from: "plan",
    label: plan.conditions.label || "Untitled occasion",
    thesis: plan.conditions.lockedMenu?.thesis || plan.menu[0]?.dish.name || "",
    guests: plan.conditions.guests,
    seatingKnown: plan.conditions.seatingKnown !== false,
    seatingCount: plan.conditions.seatingKnown === false ? null : plan.conditions.kitchen.seats,
    dishes,
    reading,
    signature: plan.signature,
    createdAt: new Date().toISOString(),
    ...(reopen ? { reopen } : {}),
  };
  const check = validateHouseReturn(payload);
  if (!check.valid) throw new Error(check.errors.join(" "));
  return check.payload;
}

export function returnFromArchitecture(
  input: MenuBuilderInput,
  result: MenuBuilderResult,
  reopen?: string,
): HouseReturnPayload | null {
  if (!result || result.status === "invalid") return null;
  const blocks = result.dishPlan ?? [];
  const dishes = blocks
    .map((block) =>
      block.primary
        ? { id: block.primary.id, name: block.primary.name, course: block.role }
        : null,
    )
    .filter((row): row is { id: string; name: string; course: string } => Boolean(row))
    .slice(0, 12);
  if (!dishes.length && result.roles) {
    for (const [role, name] of Object.entries(result.roles)) {
      dishes.push({ id: role, name: String(name), course: role });
    }
  }
  const reading = compactReading(
    matchReading({
      dishIds: dishes.map((d) => d.id),
      names: dishes.map((d) => d.name),
      courses: dishes.map((d) => d.course ?? ""),
      occasion: String(input.occasion || ""),
      beverage: String(input.beverageRoute || ""),
      serviceStyle: String(input.serviceStyle || ""),
      locked: Boolean(input.lockedAnchorId || result.lockedAnchorId),
    }),
  );
  const guests = Number(input.guestCount);
  if (!Number.isSafeInteger(guests) || guests <= 0) return null;
  const payload: HouseReturnPayload = {
    v: HOUSE_RETURN_VERSION,
    from: "architecture",
    label: String(input.occasion || "Architecture"),
    thesis: String(result.thesis || ""),
    guests,
    seatingKnown: input.seatingKnown !== false,
    seatingCount: input.seatingKnown === false ? null : input.seatingCount ?? null,
    dishes,
    reading,
    signature: `${input.occasion}-${guests}-${result.lockedAnchorId || "open"}`,
    createdAt: new Date().toISOString(),
    ...(reopen ? { reopen } : {}),
  };
  const check = validateHouseReturn(payload);
  return check.valid ? check.payload : null;
}

export function returnFromCard(input: {
  title: string;
  subtitle?: string;
  lines: { id: string; name: string; course: string }[];
  guests?: number;
  signature?: string;
  reopen?: string;
}): HouseReturnPayload | null {
  const dishes = input.lines
    .filter((line) => line.name.trim())
    .slice(0, 12)
    .map((line) => ({ id: line.id, name: line.name, course: line.course }));
  if (!dishes.length) return null;
  const guests = input.guests && input.guests > 0 ? input.guests : 8;
  const reading = compactReading(
    matchReading({
      dishIds: dishes.map((d) => d.id),
      names: dishes.map((d) => d.name),
      courses: dishes.map((d) => d.course),
      occasion: input.title,
    }),
  );
  const payload: HouseReturnPayload = {
    v: HOUSE_RETURN_VERSION,
    from: "card",
    label: input.title || "Menu card",
    thesis: input.subtitle || "",
    guests,
    seatingKnown: true,
    dishes,
    reading,
    signature: input.signature || `card-${dishes.map((d) => d.id).join("+")}`,
    createdAt: new Date().toISOString(),
    ...(input.reopen ? { reopen: input.reopen } : {}),
  };
  const check = validateHouseReturn(payload);
  return check.valid ? check.payload : null;
}
