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
  | "no-alcohol";

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
}

export interface Kitchen {
  ovens: number;
  burners: number;
  grill: boolean;
  dishwasher: boolean;
  fridge: "tight" | "normal" | "roomy";
  counter: "small" | "medium" | "large";
  seats: number;
}

export interface Conditions {
  label: string;
  shape: OccasionShape;
  style: ServiceStyle;
  guests: number;
  helpers: number;
  serviceTime: string; // "18:30"
  prepWindowH: number; // hours available on the day
  ambition: 1 | 2 | 3;
  diets: DietFilter[];
  kitchen: Kitchen;
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
  signature: string;
}
