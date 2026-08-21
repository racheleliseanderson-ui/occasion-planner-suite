/** Shared types for SC-MB-001 Menu Builder UI layer. */

export type ServiceStyle = "family_style" | "buffet" | "plated" | "grazing";
export type CapacityLevel = "limited" | "standard" | "generous";
export type AttentionLevel = "low" | "moderate" | "high";
export type MenuArc =
  | "bright_light"
  | "rich_comforting"
  | "seasonal"
  | "celebratory"
  | "relaxed";
export type BeverageRoute = "both" | "zero_proof" | "alcoholic";
export type GuestBand = "under_12" | "12_24" | "25_50" | "over_50" | "under_25";
export type ScoreBand = "strong" | "workable" | "fragile";
export type PairingMode = "congruence" | "contrast" | "balanced";

/** Drink architecture roles — parallel to food Welcome/Anchor/Contrast/Relief/Finish.
 * Operational and resource-aware. Never a generic cocktail generator. */
export type DrinkRole = "arrival" | "volume" | "cut" | "equal" | "station";

export interface MenuBuilderInput {
  occasion: string;
  guestCount: number;
  guestBand: GuestBand | string;
  serviceStyle: ServiceStyle | string;
  eventDayTime: AttentionLevel | string;
  prepCapacity: CapacityLevel | string;
  kitchenCapacity: CapacityLevel | string;
  attentionBand: AttentionLevel | string;
  menuArc: MenuArc | string;
  beverageRoute: BeverageRoute | string;
  budgetPressure: boolean;
  dietaryCategories: string[];
  declaredAllergens: string[];
  equipmentConstraints: string[];
  cuisine: string;
  lockedAnchorId: string | null;
  /** Locked equal-status zero-proof drink. Required unless beverageRoute is alcoholic. */
  lockedEqualId?: string | null;
  /** When true, seatingCount is a declared fact. When false/absent, Plan must ask. */
  seatingKnown?: boolean;
  seatingCount?: number | null;
}

export interface DishPrimary {
  id: string;
  name: string;
  blurb: string;
  why?: string;
  makeAhead: boolean;
  heat: string;
  richness?: string;
  texture?: string;
  flavorFamilies: string[];
  score: number;
  fitReasons: string[];
}

export interface DishAlternative {
  id: string;
  name: string;
  blurb: string;
  makeAhead: boolean;
  heat: string;
  score: number;
  fitReasons: string[];
  flavorFamilies: string[];
}

export interface DishPlanBlock {
  role: string;
  primary: DishPrimary | null;
  alternatives: DishAlternative[];
}

/** Parallel structure for the drink architecture track. */
export interface DrinkPlanBlock {
  role: DrinkRole;
  primary: DishPrimary | null;
  alternatives: DishAlternative[];
}

export interface MenuStressTest {
  score: number;
  band: ScoreBand | string;
  dimensions: Record<string, number>;
  weakDimensions: Array<{ dimension: string; score: number; band: string }>;
  verdict: string;
}

/** Stress test for the beverage route. Same shape as food for consistent UI and hard-stop logic. */
export interface BeverageStressTest {
  score: number;
  band: ScoreBand | string;
  dimensions: Record<string, number>;
  weakDimensions: Array<{ dimension: string; score: number; band: string }>;
  verdict: string;
}

export interface MenuBuilderResult {
  status: "invalid" | "menu_structure" | "menu_with_constraints" | string;
  errors?: string[];
  applicationId?: string;
  thesis?: string;
  roles?: Record<string, string>;
  serviceLogic?: string;
  menuStressTest?: MenuStressTest;
  dietaryNotes?: string[];
  attentionAndEquipmentConflicts?: string[];
  prepTimeline?: {
    early: string;
    dayBefore: string;
    eventDay: string;
    service: string;
  };
  beverageDirection?: string;
  /** Explicit locked beverage route produced by the drink track. */
  beverageRouteResult?: {
    roles: Partial<Record<DrinkRole, string>>;
    lockedEqualId: string | null;
    selectedDrinkIds: string[];
    stress?: BeverageStressTest;
    direction: string;
    zeroProofDirection: string;
    mode: BeverageRoute | string;
  };
  safetyBoundaries?: string[];
  simplifyFirst?: string[];
  recoveryPlan?: string[];
  nextActions?: string[];
  confidence?: {
    score: number;
    band: string;
    explanation: string;
  };
  pairingMode?: PairingMode | string;
  pairingModeNote?: string;
  lockedAnchorId?: string | null;
  lockedEqualId?: string | null;
  dishPlan?: DishPlanBlock[];
  drinkPlan?: DrinkPlanBlock[];
  beverageStressTest?: BeverageStressTest;
  selectedDrinkIds?: string[];
  expansion?: MenuBuilderExpansion;
}

export interface ExpansionConflict {
  code: string;
  message: string;
  whyItMatters: string;
  nextAction: string;
}

export interface HardStop {
  code: string;
  message: string;
  nextAction: string;
}

export interface MenuBuilderExpansion {
  schemaVersion: string;
  unknowns: string[];
  conflicts: ExpansionConflict[];
  hardStops: HardStop[];
  explanation: string[];
  nextActions: Array<{ priority: number; action: string; owner: string }>;
  canContinue: boolean;
}

export interface HistoryEntry {
  id: string;
  label: string;
  thesis: string;
  band: string;
  score: number;
  savedAt: string;
  input: MenuBuilderInput;
}

export const STORAGE_KEY = "oos-architecture-input-v1";
export const HISTORY_KEY = "oos-architecture-history-v1";
export const PLAN_STASH_KEY = "oos-architecture-plan-v1";
export const APP_VERSION = "0.6.0";
export const ENGINE_VERSION = "0.4.3";

export const OCCASION_OS_PLAN_URL = "/";

export const OCCASION_OPTIONS = [
  "Dinner with friends",
  "Birthday gathering",
  "Holiday meal",
  "Open-house gathering",
  "Weeknight hosting",
  "Sunday lunch",
  "Vegetarian supper",
  "Cocktail hour",
  "High-country gathering",
] as const;

export const DEFAULT_INPUT: MenuBuilderInput = {
  occasion: "Dinner with friends",
  guestCount: 18,
  guestBand: "12_24",
  serviceStyle: "family_style",
  eventDayTime: "moderate",
  prepCapacity: "standard",
  kitchenCapacity: "standard",
  attentionBand: "moderate",
  menuArc: "relaxed",
  beverageRoute: "both",
  budgetPressure: false,
  dietaryCategories: [],
  declaredAllergens: [],
  equipmentConstraints: [],
  cuisine: "any",
  lockedAnchorId: null,
  lockedEqualId: null,
  seatingKnown: false,
  seatingCount: null,
};


/** Starting situations — load to fill the form, not invented recipes. */
export type ScenarioPreset = {
  id: string;
  name: string;
  blurb: string;
  input: Partial<MenuBuilderInput>;
};

export const SCENARIOS: ScenarioPreset[] = [
  {
    id: "weeknight-6",
    name: "Weeknight for six",
    blurb: "Moderate attention, limited prep window, family-style.",
    input: {
      occasion: "Weeknight hosting",
      guestCount: 6,
      guestBand: "under_12",
      serviceStyle: "family_style",
      eventDayTime: "low",
      prepCapacity: "limited",
      kitchenCapacity: "standard",
      attentionBand: "moderate",
      menuArc: "relaxed",
      beverageRoute: "both",
      budgetPressure: true,
      dietaryCategories: [],
      declaredAllergens: [],
      equipmentConstraints: ["limited_burners"],
      cuisine: "any",
      lockedAnchorId: null,
      seatingKnown: true,
      seatingCount: 6,
    },
  },
  {
    id: "birthday-12",
    name: "Birthday table · 12",
    blurb: "Celebratory arc, plated risk if attention is split.",
    input: {
      occasion: "Birthday gathering",
      guestCount: 12,
      guestBand: "12_24",
      serviceStyle: "family_style",
      eventDayTime: "moderate",
      prepCapacity: "standard",
      kitchenCapacity: "standard",
      attentionBand: "high", // will fix below
      menuArc: "celebratory",
      beverageRoute: "both",
      budgetPressure: false,
      dietaryCategories: ["vegetarian"],
      declaredAllergens: [],
      equipmentConstraints: [],
      cuisine: "any",
      lockedAnchorId: null,
      seatingKnown: true,
      seatingCount: 12,
    },
  },
  {
    id: "holiday-20",
    name: "Holiday · 20",
    blurb: "Rich comfort, generous prep, equipment likely binds.",
    input: {
      occasion: "Holiday meal",
      guestCount: 20,
      guestBand: "12_24",
      serviceStyle: "family_style",
      eventDayTime: "high",
      prepCapacity: "generous",
      kitchenCapacity: "standard",
      attentionBand: "moderate",
      menuArc: "rich_comforting",
      beverageRoute: "both",
      budgetPressure: false,
      dietaryCategories: ["gluten-aware"],
      declaredAllergens: [],
      equipmentConstraints: ["limited_oven"],
      cuisine: "any",
      lockedAnchorId: null,
      seatingKnown: true,
      seatingCount: 20,
    },
  },
  {
    id: "open-house-40",
    name: "Open house · 40",
    blurb: "Buffet/grazing, high volume — plated is a hard stop risk.",
    input: {
      occasion: "Open-house gathering",
      guestCount: 40,
      guestBand: "25_50",
      serviceStyle: "buffet",
      eventDayTime: "moderate",
      prepCapacity: "generous",
      kitchenCapacity: "limited",
      attentionBand: "low",
      menuArc: "seasonal",
      beverageRoute: "zero_proof",
      budgetPressure: true,
      dietaryCategories: ["vegetarian", "vegan"],
      declaredAllergens: [],
      equipmentConstraints: ["limited_oven", "limited_burners", "limited_refrigeration"],
      cuisine: "any",
      lockedAnchorId: null,
      seatingKnown: false,
      seatingCount: null,
    },
  },
  {
    id: "plated-stress",
    name: "Plated stress test",
    blurb: "Large party + plated + low attention — demonstrates hard stop.",
    input: {
      occasion: "Dinner with friends",
      guestCount: 55,
      guestBand: "over_50",
      serviceStyle: "plated",
      eventDayTime: "low",
      prepCapacity: "limited",
      kitchenCapacity: "limited",
      attentionBand: "low",
      menuArc: "celebratory",
      beverageRoute: "alcoholic",
      budgetPressure: false,
      dietaryCategories: [],
      declaredAllergens: [],
      equipmentConstraints: ["limited_burners"],
      cuisine: "any",
      lockedAnchorId: null,
      seatingKnown: true,
      seatingCount: 24,
    },
  },
  {
    id: "sunday-lunch-8",
    name: "Sunday lunch · 8",
    blurb: "Relaxed family-style, generous prep, one oven is enough.",
    input: {
      occasion: "Sunday lunch",
      guestCount: 8,
      guestBand: "under_12",
      serviceStyle: "family_style",
      eventDayTime: "moderate",
      prepCapacity: "generous",
      kitchenCapacity: "standard",
      attentionBand: "high",
      menuArc: "rich_comforting",
      beverageRoute: "both",
      budgetPressure: false,
      dietaryCategories: [],
      declaredAllergens: [],
      equipmentConstraints: ["limited_oven"],
      cuisine: "any",
      lockedAnchorId: null,
      seatingKnown: true,
      seatingCount: 8,
    },
  },
  {
    id: "vegetarian-dinner-10",
    name: "Vegetarian dinner · 10",
    blurb: "Plant-led table, family-style, dairy still in play unless you say otherwise.",
    input: {
      occasion: "Vegetarian supper",
      guestCount: 10,
      guestBand: "under_12",
      serviceStyle: "family_style",
      eventDayTime: "moderate",
      prepCapacity: "standard",
      kitchenCapacity: "standard",
      attentionBand: "moderate",
      menuArc: "seasonal",
      beverageRoute: "both",
      budgetPressure: false,
      dietaryCategories: ["vegetarian"],
      declaredAllergens: [],
      equipmentConstraints: [],
      cuisine: "any",
      lockedAnchorId: null,
      seatingKnown: true,
      seatingCount: 10,
    },
  },
  {
    id: "egg-free-brunch-8",
    name: "Egg-free brunch · 8",
    blurb: "Declares egg as an actual exclusion — not a vegetarian stand-in.",
    input: {
      occasion: "Sunday lunch",
      guestCount: 8,
      guestBand: "under_12",
      serviceStyle: "family_style",
      eventDayTime: "moderate",
      prepCapacity: "standard",
      kitchenCapacity: "standard",
      attentionBand: "moderate",
      menuArc: "bright_light",
      beverageRoute: "both",
      budgetPressure: false,
      dietaryCategories: [],
      declaredAllergens: ["egg"],
      equipmentConstraints: [],
      cuisine: "any",
      lockedAnchorId: null,
      seatingKnown: true,
      seatingCount: 8,
    },
  },
  {
    id: "cocktail-zero-16",
    name: "Cocktail hour · 16",
    blurb: "Standing reception, zero-proof required, seating unknown on purpose.",
    input: {
      occasion: "Cocktail hour",
      guestCount: 16,
      guestBand: "12_24",
      serviceStyle: "grazing",
      eventDayTime: "moderate",
      prepCapacity: "limited",
      kitchenCapacity: "limited",
      attentionBand: "low",
      menuArc: "bright_light",
      beverageRoute: "zero_proof",
      budgetPressure: false,
      dietaryCategories: [],
      declaredAllergens: [],
      equipmentConstraints: ["limited_oven"],
      cuisine: "any",
      lockedAnchorId: null,
      seatingKnown: false,
      seatingCount: null,
    },
  },
  {
    id: "high-country-12",
    name: "High-country table · 12",
    blurb: "One oven, limited burners, celebratory dinner at altitude.",
    input: {
      occasion: "High-country gathering",
      guestCount: 12,
      guestBand: "12_24",
      serviceStyle: "family_style",
      eventDayTime: "high",
      prepCapacity: "standard",
      kitchenCapacity: "limited",
      attentionBand: "moderate",
      menuArc: "celebratory",
      beverageRoute: "both",
      budgetPressure: false,
      dietaryCategories: [],
      declaredAllergens: [],
      equipmentConstraints: ["limited_oven", "limited_burners"],
      cuisine: "any",
      lockedAnchorId: null,
      seatingKnown: true,
      seatingCount: 12,
    },
  },
  {
    id: "no-oven-reception-24",
    name: "No-oven reception · 24",
    blurb: "Explicitly no oven — not a limited one. Grazing, make-ahead only.",
    input: {
      occasion: "Open-house gathering",
      guestCount: 24,
      guestBand: "12_24",
      serviceStyle: "grazing",
      eventDayTime: "moderate",
      prepCapacity: "generous",
      kitchenCapacity: "limited",
      attentionBand: "low",
      menuArc: "seasonal",
      beverageRoute: "both",
      budgetPressure: true,
      dietaryCategories: [],
      declaredAllergens: [],
      equipmentConstraints: ["no_oven"],
      cuisine: "any",
      lockedAnchorId: null,
      seatingKnown: false,
      seatingCount: null,
    },
  },
];
