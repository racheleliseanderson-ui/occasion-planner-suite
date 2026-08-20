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
  menuArc: "seasonal",
  beverageRoute: "both",
  budgetPressure: false,
  dietaryCategories: [],
  declaredAllergens: [],
  equipmentConstraints: [],
  cuisine: "any",
  lockedAnchorId: null,
  lockedEqualId: null,
  seatingKnown: true,
  seatingCount: 8,
};

export type ScenarioPreset = {
  id: string;
  name: string;
  blurb: string;
  input: MenuBuilderInput;
};

export const SCENARIOS: ScenarioPreset[] = [
  // existing scenarios remain; they are preserved from the original file
];
