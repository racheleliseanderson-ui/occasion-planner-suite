// Occasion Operating System — domain types.
// Educational planning tool. Dietary tags are planning filters, not allergy guarantees.

export type ServiceStyle = "seated" | "buffet" | "grazing" | "cocktail";

export type OccasionShape =
  | "dinner"
  | "brunch"
  | "reception"
  | "cookout"
  | "aperitivo";

export type Contains =
  | "meat"
  | "pork"
  | "fish"
  | "shellfish"
  | "dairy"
  | "gluten"
  | "nut"
  | "egg"
  | "alcohol";

export type DietFilter =
  | "no-meat"
  | "no-animal"
  | "no-gluten"
  | "no-dairy"
  | "no-nut"
  | "no-shellfish"
  | "no-pork"
  | "no-alcohol"
  | "no-egg";

export type Course = "board" | "starter" | "anchor" | "side" | "bread" | "sweet" | "drink";

export type Aisle =
  | "produce"
  | "protein"
  | "dairy"
  | "pantry"
  | "bakery"
  | "frozen"
  | "drinks"
  | "non-food";

export interface IngredientLine {
  item: string;
  perGuest: number;
  unit: string;
  aisle: Aisle;
}

export type Season = "spring" | "summer" | "autumn" | "winter" | "year-round";

export type CookMethod = "roast" | "braise" | "fry" | "boil" | "grill" | "raw" | "bake" | "chill";

export type TempBand = "cold" | "ambient" | "warm" | "hot";

export type BudgetTier = 1 | 2 | 3;

export interface Dish {
  id: string;
  name: string;
  course: Course;
  note: string;
  contains: Contains[];
  formats: ServiceStyle[];
  shapes: OccasionShape[];
  /** minutes of oven occupancy per batch (0 = none) */
  ovenMin: number;
  /** minutes of a single burner per batch (0 = none) */
  burnerMin: number;
  grill?: boolean;
  /** fridge units consumed while holding (1 unit ≈ one shelf-third) */
  fridgeUnits: number;
  /** counter footprint while working, 1–3 */
  counter: number;
  /** hands-on minutes per batch */
  activeMin: number;
  servesPerBatch: number;
  /** how many days ahead the dish can be completed (0 = day of only) */
  makeAheadDays: 0 | 1 | 2;
  /** minutes the finished dish holds acceptably before service */
  holdMin: number;
  ingredients: IngredientLine[];
  /** seasons the dish reads correctly in */
  season?: Season[];
  /** indicative planning cost per guest, in your local currency unit */
  costPerGuest?: number;
  /** dominant cooking method, used for menu balance scoring */
  method?: CookMethod;
  /** temperature the dish lands at on the table */
  tempBand?: TempBand;
  /** true if it survives a crowd of children without negotiation */
  kidFriendly?: boolean;
  /** true if it holds up outdoors in warm air */
  outdoorSafe?: boolean;
  /** culinary tradition the dish is read against; "house" = unattributed */
  cuisine?: Cuisine;
}

/** Culinary traditions carried in the library. Attribution, not authenticity claim. */
export type Cuisine =
  | "house"
  | "italian"
  | "aegean"
  | "levantine"
  | "persian"
  | "indian"
  | "seasia"
  | "chinese"
  | "japanese"
  | "mexican"
  | "caribbean"
  | "west-african"
  | "nordic";


export interface Kitchen {
  ovens: number;
  burners: number;
  grill: boolean;
  dishwasher: boolean;
  fridge: "tight" | "normal" | "roomy";
  counter: "small" | "medium" | "large";
  seats: number;
  /** Limited means reduced capacity, not absence. */
  ovenLimited?: boolean;
  burnerLimited?: boolean;
}

export interface LockedMenu {
  dishIds: string[];
  roles: Record<string, string>;
  lockedAnchorId?: string | null;
  thesis: string;
  beverageDirection: string;
  zeroProofDirection: string;
  simplifications: string[];
  unknowns: string[];
  substitutions: { from: string; to: string }[];
  signature: string;
  source: {
    tool: "architecture";
    contractVersion: string;
    engineVersion: string;
    fixtureVersion: string;
    createdAt: string;
  };
}

export interface Conditions {
  label: string;
  shape: OccasionShape;
  style: ServiceStyle;
  guests: number;
  helpers: number;
  serviceTime: string; // "18:30"
  /** First-class event date (YYYY-MM-DD). Optional so older saved files still load. */
  eventDate?: string;
  prepWindowH: number; // hours available on the day
  ambition: 1 | 2 | 3;
  diets: DietFilter[];
  /** culinary traditions the host wants on the table; empty = no restriction */
  cuisines?: Cuisine[];

  kitchen: Kitchen;
  /** season drives dish availability and a seasonal note */
  season: Season;
  /** per-head ceiling tier: 1 modest, 2 considered, 3 unconstrained */
  budgetTier: BudgetTier;
  /** children at the table */
  kids: boolean;
  /** usable outdoor space */
  outdoor: boolean;
  /** deliberate leftovers goal */
  leftovers: "none" | "some" | "deliberate";
  /** extended operating conditions; optional so older saved files still load */
  ops?: Ops;
  /**
   * When false, seats have not been declared. Plan must ask — never invent chairs.
   * Absent/undefined is treated as known for older saved files.
   */
  seatingKnown?: boolean;
  /** Architecture decision that Plan must preserve, not silently replace. */
  lockedMenu?: LockedMenu;
}

/** Seating and course choreography for a table-led occasion. */
export interface TableOps {
  tables: number;
  seatsPerTable: number;
  /** courses actually served at the table */
  courses: number;
  serviceMode: "plated" | "family" | "passed";
  /** finishing a dish in front of guests costs service attention */
  tablesideFinishing: boolean;
}

/** Flow control for a standing or self-service crowd. */
export interface CrowdOps {
  /** share of guests who will be standing, 0–1 */
  standingShare: number;
  /** minutes between the first and last arrival */
  arrivalSpreadMin: number;
  /** separate serving points */
  stations: number;
  selfServe: boolean;
  /** minutes between refills of a station */
  refillCadenceMin: number;
}

/** Hard limits of the room, the sink, the money and the shopping. */
export interface ConstraintOps {
  sink: "scarce" | "single" | "double";
  /** usable prep surfaces */
  prepSurfaces: number;
  singleBurnerMode: boolean;
  noOvenMode: boolean;
  /** extra cold boxes or coolers beyond the fridge */
  coldBoxes: number;
  powerLimited: boolean;
  /** a noise or finish-by curfew applies */
  curfew: boolean;
  shoppingTrips: number;
  pantryOnly: boolean;
  /** absolute per-head ceiling that overrides the budget tier */
  hardCapPerHead: number | null;
}

/** What is actually available outside. */
export interface OutdoorOps {
  grillType: "none" | "gas" | "charcoal" | "kamado";
  smoker: boolean;
  firePit: boolean;
  power: boolean;
  water: boolean;
  shade: boolean;
  weatherRisk: "low" | "medium" | "high";
  /** minutes of transport between kitchen and serving point */
  transportMin: number;
  /** cooler capacity in the same shelf units as the fridge gauge */
  coolerCapacity: number;
  insectPressure: boolean;
}

/** Host-level conditions that colour the whole route. */
export interface GeneralOps {
  skill: 1 | 2 | 3;
  alcohol: boolean;
  serviceDurationMin: number;
  cleanupWindowMin: number;
  dietStrictness: "preference" | "strict";
}

export interface Ops {
  table: TableOps;
  crowd: CrowdOps;
  constraint: ConstraintOps;
  outdoor: OutdoorOps;
  general: GeneralOps;
}


export type LoadLabel = "under-used" | "controlled" | "tight" | "overloaded";

export interface LoadGauge {
  key: string;
  name: string;
  used: number;
  capacity: number;
  unit: string;
  pct: number;
  label: LoadLabel;
  detail: string;
}

export interface Stop {
  code: string;
  title: string;
  detail: string;
  correction: string;
}

/** Host-facing correction offered from a stop on the plan. */
export interface StopAction {
  id: string;
  label: string;
  preview: string;
}

export interface PlannedDish {
  dish: Dish;
  batches: number;
  serves: number;
  when: "d2" | "d1" | "dayof";
}

export interface TimelineEntry {
  phase: "D-2" | "D-1" | "Day of" | "Service";
  clock: string;
  offsetMin: number;
  task: string;
  dish: string;
  minutes: number;
  resource: "oven" | "burner" | "grill" | "cold" | "hands" | "table";
  /** who is carrying the task: the host or a named helper slot */
  owner?: string;
}

export interface ShoppingLine {
  item: string;
  qty: number;
  unit: string;
  aisle: Aisle;
  forDishes: string[];
}

export interface Plan {
  conditions: Conditions;
  stops: Stop[];
  advisories: string[];
  menu: PlannedDish[];
  gauges: LoadGauge[];
  feasibility: number; // 0–100, higher = more headroom
  verdict: LoadLabel;
  timeline: TimelineEntry[];
  shopping: ShoppingLine[];
  service: TimelineEntry[];
  makeAheadShare: number; // 0–1
  handsOnMin: number;
  /** indicative planning cost, not live prices */
  costPerHead: number;
  costTotal: number;
  costCeiling: number;
  /** 0–100, higher = better spread of method, temperature and timing */
  balance: number;
  balanceNotes: string[];
  signature: string;
}
