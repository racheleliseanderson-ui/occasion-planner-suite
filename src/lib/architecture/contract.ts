/**
 * Canonical Architecture → Plan handoff contract.
 * One typed schema. One mapper. Fail closed. Never invent seats.
 * Limited equipment means limited capacity, not absence.
 */
import { z } from "zod";
import {
  APPLICATION_ID,
  CONTRACT_VERSION,
  ENGINE_VERSION,
  FIXTURE_VERSION,
  SCHEMA_VERSION,
} from "@/lib/oos/versions";
import type { DietFilter, ServiceStyle } from "@/lib/oos/types";
import type { MenuBuilderInput, MenuBuilderResult } from "./types";

export const MENU_OCCASION_HANDOFF_MESSAGE = "salty:menu-occasion-handoff";
export const MENU_OCCASION_HANDOFF_STATUS_MESSAGE = "salty:menu-occasion-handoff-status";
export const MENU_OCCASION_HANDOFF_VERSION = CONTRACT_VERSION;

const PROHIBITED_FIELDS = new Set([
  "guestNames",
  "emailAddresses",
  "medicalHistory",
  "exactAllergySafetyConclusion",
  "paymentData",
  "currentPriceGuarantees",
]);

const serviceStyleSchema = z.enum(["seated", "buffet", "grazing", "cocktail"]);
const equipmentLevelSchema = z.enum(["full", "limited", "none"]);
const allergenSchema = z.enum(["gluten", "egg", "milk", "tree-nut", "shellfish", "peanut"]);

export const handoffPacketSchema = z.object({
  applicationId: z.literal(APPLICATION_ID),
  contractVersion: z.string().min(1),
  engineVersion: z.string().min(1),
  fixtureVersion: z.string().min(1),
  schemaVersion: z.string().min(1),
  createdAt: z.string().min(1),
  signature: z.string().min(1),
  occasionType: z.string().min(1),
  guestCount: z.number().int().positive(),
  serviceStyle: serviceStyleSchema,
  seatingDeclared: z.boolean(),
  seatingCount: z.number().int().nonnegative().nullable(),
  menuThesis: z.string(),
  menuRoles: z.record(z.string(), z.string()),
  selectedDishIds: z.array(z.string()),
  lockedAnchorId: z.string().nullable(),
  substitutions: z.array(z.object({ from: z.string(), to: z.string() })),
  equipmentConstraints: z.array(z.string()),
  equipmentLimits: z.object({
    oven: equipmentLevelSchema,
    burners: equipmentLevelSchema,
    refrigeration: equipmentLevelSchema,
  }),
  hostAttention: z.string(),
  dietaryCategories: z.array(z.string()),
  allergenBoundary: z.object({
    declaredCategories: z.array(z.string()),
    statement: z.string(),
  }),
  beverageDirection: z.string(),
  zeroProofDirection: z.string(),
  beverageMode: z.string(),
  simplifications: z.array(z.string()),
  unknowns: z.array(z.string()),
  conflicts: z.array(z.unknown()),
  hardStops: z.array(z.unknown()),
  explanation: z.array(z.string()),
  nextActions: z.array(z.unknown()),
});

export type HandoffPacket = z.infer<typeof handoffPacketSchema>;

export type EquipmentLevel = z.infer<typeof equipmentLevelSchema>;

const SERVICE_STYLE_MAP: Record<string, ServiceStyle> = {
  family_style: "seated",
  plated: "seated",
  buffet: "buffet",
  grazing: "grazing",
  cocktail: "cocktail",
  seated: "seated",
};

const ALLERGEN_MAP: Record<string, z.infer<typeof allergenSchema>> = {
  gluten: "gluten",
  egg: "egg",
  eggs: "egg",
  milk: "milk",
  dairy: "milk",
  "tree nut": "tree-nut",
  "tree-nut": "tree-nut",
  nut: "tree-nut",
  nuts: "tree-nut",
  shellfish: "shellfish",
  peanut: "peanut",
  peanuts: "peanut",
};

function inspectProhibited(value: unknown, found: string[]) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (PROHIBITED_FIELDS.has(key)) found.push(key);
    if (child && typeof child === "object") inspectProhibited(child, found);
  }
}

function equipmentLevel(constraints: string[], limitedKey: string, noneKey?: string): EquipmentLevel {
  if (noneKey && constraints.includes(noneKey)) return "none";
  if (constraints.includes(limitedKey)) return "limited";
  return "full";
}

function signatureFor(parts: Array<string | number | null | undefined>): string {
  return parts
    .map((p) => String(p ?? "—"))
    .join("·")
    .slice(0, 120);
}

export function validateMenuOccasionHandoff(value: unknown): { valid: boolean; errors: string[] } {
  const parsed = handoffPacketSchema.safeParse(value);
  const errors: string[] = parsed.success ? [] : parsed.error.issues.map((i) => i.message);
  if (parsed.success) {
    if (parsed.data.hardStops.length) errors.push("Handoff cannot contain unresolved hardStops.");
    if (!["1.1.0", CONTRACT_VERSION].includes(parsed.data.contractVersion)) {
      errors.push("Unsupported handoff contractVersion.");
    }
  }
  const found: string[] = [];
  inspectProhibited(value, found);
  if (found.length) errors.push(`Prohibited handoff fields found: ${[...new Set(found)].join(", ")}.`);
  return { valid: errors.length === 0, errors };
}

export function buildMenuOccasionHandoff(
  input: MenuBuilderInput,
  output: MenuBuilderResult,
): { status: "ready"; handoff: HandoffPacket } | { status: "invalid"; errors: string[] } {
  const guestCount = Number(input?.guestCount);
  const serviceStyle = SERVICE_STYLE_MAP[String(input?.serviceStyle)] ?? null;
  const errors: string[] = [];

  if (!output || !["menu_structure", "menu_with_constraints"].includes(String(output.status))) {
    errors.push("A valid Menu Builder result is required.");
  }
  if (!Number.isSafeInteger(guestCount) || guestCount <= 0) {
    errors.push("guestCount must be a positive integer.");
  }
  if (!serviceStyle) errors.push("A supported service style is required.");
  if (output?.expansion?.hardStops?.length) {
    errors.push("Hard stops must be resolved before Occasion OS transfer.");
  }
  if (errors.length) return { status: "invalid", errors };

  const beverageMode = String(input.beverageRoute || "both");
  const zeroProofDirection =
    beverageMode === "zero_proof"
      ? "Zero-proof is the primary pairing route and must retain full flavor, visual, and service intention."
      : beverageMode === "alcoholic"
        ? "An equal-status zero-proof counterpart is required alongside the alcoholic route."
        : "The primary pairing and an equal-status zero-proof counterpart are both required.";

  const constraints = [...new Set(input.equipmentConstraints || [])];
  const dishIds = (output.dishPlan || [])
    .map((block) => block.primary?.id)
    .filter((id): id is string => Boolean(id));

  const seatingDeclared = input.seatingKnown === true && Number.isSafeInteger(input.seatingCount);
  const seatingCount = seatingDeclared ? Number(input.seatingCount) : null;

  const unknowns = [
    ...(output.expansion?.unknowns || [
      "exact recipes and ingredient identities",
      "supplier and label verification",
      "cross-contact controls",
      "live holding and service conditions",
    ]),
  ];
  if (!seatingDeclared) unknowns.unshift("exact seating has not been declared");

  const createdAt = new Date().toISOString();
  const handoff: HandoffPacket = {
    applicationId: APPLICATION_ID,
    contractVersion: CONTRACT_VERSION,
    engineVersion: ENGINE_VERSION,
    fixtureVersion: FIXTURE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    createdAt,
    signature: signatureFor([
      input.occasion,
      guestCount,
      serviceStyle,
      seatingCount,
      dishIds.join("+"),
      output.thesis,
      CONTRACT_VERSION,
      ENGINE_VERSION,
    ]),
    occasionType: String(input.occasion),
    guestCount,
    serviceStyle,
    seatingDeclared,
    seatingCount,
    menuThesis: String(output.thesis || ""),
    menuRoles: { ...(output.roles || {}) },
    selectedDishIds: dishIds,
    lockedAnchorId: output.lockedAnchorId ?? input.lockedAnchorId ?? null,
    substitutions: [],
    equipmentConstraints: constraints,
    equipmentLimits: {
      oven: equipmentLevel(constraints, "limited_oven", "no_oven"),
      burners: equipmentLevel(constraints, "limited_burners", "no_burners"),
      refrigeration: equipmentLevel(constraints, "limited_refrigeration"),
    },
    hostAttention: String(input.attentionBand),
    dietaryCategories: [...new Set(input.dietaryCategories || [])],
    allergenBoundary: {
      declaredCategories: [...new Set(input.declaredAllergens || [])],
      statement:
        "Declared categories require controlled recipes, ingredient verification, and cross-contact review. This handoff does not establish allergy safety.",
    },
    beverageDirection: String(output.beverageDirection || ""),
    zeroProofDirection,
    beverageMode,
    simplifications: [...(output.simplifyFirst || [])],
    unknowns,
    conflicts: [...(output.expansion?.conflicts || [])],
    hardStops: [...(output.expansion?.hardStops || [])],
    explanation: [...(output.expansion?.explanation || [])].map(String),
    nextActions: [...(output.expansion?.nextActions || [])],
  };

  const validation = validateMenuOccasionHandoff(handoff);
  return validation.valid ? { status: "ready", handoff } : { status: "invalid", errors: validation.errors };
}

export type MappedOccasionInput = {
  occasionType: string;
  guestCount: number;
  serviceStyle: ServiceStyle;
  excludedAllergens: string[];
  diets: DietFilter[];
  equipmentLimits: HandoffPacket["equipmentLimits"];
  includeCocktailRoute: boolean;
  selectedDishIds: string[];
  lockedAnchorId: string | null;
  seatingDeclared: boolean;
  seatingCount: number | null;
};

export function mapAllergensToDiets(declared: string[]): {
  diets: DietFilter[];
  unsupported: string[];
} {
  const diets = new Set<DietFilter>();
  const unsupported: string[] = [];
  for (const raw of declared) {
    const key = raw.toLowerCase().trim();
    const mapped = ALLERGEN_MAP[key];
    if (!mapped) {
      unsupported.push(raw);
      continue;
    }
    if (mapped === "gluten") diets.add("no-gluten");
    else if (mapped === "egg") diets.add("no-egg");
    else if (mapped === "milk") diets.add("no-dairy");
    else if (mapped === "tree-nut" || mapped === "peanut") diets.add("no-nut");
    else if (mapped === "shellfish") diets.add("no-shellfish");
  }
  return { diets: [...diets], unsupported };
}

export function mapDietaryCategories(categories: string[]): DietFilter[] {
  const out = new Set<DietFilter>();
  for (const c of categories) {
    const k = c.toLowerCase();
    if (k.includes("vegan") || k.includes("plant") || k.includes("no-animal")) out.add("no-animal");
    else if (k.includes("vegetarian") || k.includes("no-meat")) out.add("no-meat");
    else if (k.includes("gluten")) out.add("no-gluten");
    else if (k.includes("dairy")) out.add("no-dairy");
    else if (k.includes("egg")) out.add("no-egg");
  }
  return [...out];
}

/**
 * Limited ≠ absent. Limited oven keeps one oven. Limited burners keep two.
 * Only an explicit "none" removes the tool.
 */
export function kitchenFromLimits(
  limits: HandoffPacket["equipmentLimits"],
  base: { ovens: number; burners: number; fridge: "tight" | "normal" | "roomy" },
): { ovens: number; burners: number; fridge: "tight" | "normal" | "roomy"; ovenLimited: boolean; burnerLimited: boolean } {
  const ovens = limits.oven === "none" ? 0 : limits.oven === "limited" ? 1 : Math.max(1, base.ovens);
  const burners = limits.burners === "none" ? 0 : limits.burners === "limited" ? 2 : Math.max(2, base.burners);
  const fridge = limits.refrigeration === "limited" || limits.refrigeration === "none" ? "tight" : base.fridge;
  return {
    ovens,
    burners,
    fridge,
    ovenLimited: limits.oven === "limited",
    burnerLimited: limits.burners === "limited",
  };
}

export function mapMenuOccasionHandoffToOccasionInput(handoff: unknown):
  | { status: "mapped"; input: MappedOccasionInput; context: Record<string, unknown> }
  | { status: "invalid"; errors: string[] }
  | { status: "blocked"; code: string; message: string; correction: string; unsupportedAllergens: string[] } {
  const validation = validateMenuOccasionHandoff(handoff);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const packet = handoff as HandoffPacket;

  const allergen = mapAllergensToDiets(packet.allergenBoundary.declaredCategories);
  if (allergen.unsupported.length) {
    return {
      status: "blocked",
      code: "HANDOFF_ALLERGEN_CATEGORY_UNSUPPORTED",
      message: `The controlled Occasion OS fixture does not contain a reviewed mapping for: ${allergen.unsupported.join(", ")}.`,
      correction: "Reset the handoff or add a reviewed fixture substitution before producing an execution plan.",
      unsupportedAllergens: allergen.unsupported,
    };
  }

  const diets = [...new Set([...mapDietaryCategories(packet.dietaryCategories), ...allergen.diets])];

  return {
    status: "mapped",
    input: {
      occasionType: packet.occasionType,
      guestCount: packet.guestCount,
      serviceStyle: packet.serviceStyle,
      excludedAllergens: allergen.diets,
      diets,
      equipmentLimits: packet.equipmentLimits,
      includeCocktailRoute: packet.beverageMode !== "zero_proof",
      selectedDishIds: packet.selectedDishIds,
      lockedAnchorId: packet.lockedAnchorId,
      seatingDeclared: packet.seatingDeclared,
      seatingCount: packet.seatingCount,
    },
    context: {
      applicationId: packet.applicationId,
      contractVersion: packet.contractVersion,
      engineVersion: packet.engineVersion,
      fixtureVersion: packet.fixtureVersion,
      schemaVersion: packet.schemaVersion,
      signature: packet.signature,
      menuThesis: packet.menuThesis,
      dietaryCategories: packet.dietaryCategories,
      equipmentConstraints: packet.equipmentConstraints,
      simplifications: packet.simplifications,
      unknowns: packet.unknowns,
      conflicts: packet.conflicts,
      explanation: packet.explanation,
      nextActions: packet.nextActions,
      beverageDirection: packet.beverageDirection,
      zeroProofDirection: packet.zeroProofDirection,
      menuRoles: packet.menuRoles,
      createdAt: packet.createdAt,
    },
  };
}

export function guestBandFromCount(value: number): string {
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count <= 0) return "under_12";
  if (count < 12) return "under_12";
  if (count <= 24) return "12_24";
  if (count <= 50) return "25_50";
  return "over_50";
}
