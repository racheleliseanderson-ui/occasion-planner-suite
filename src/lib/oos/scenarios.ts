import type { Conditions, Ops } from "./types";
import { withDefaults } from "./ops";

/** Declared limits for a scenario, with every unstated group left at its default. */
const o = (p: Partial<Ops>): Ops => withDefaults(p);

export interface Scenario {
  id: string;
  label: string;
  note: string;
  family: "Table" | "Crowd" | "Constrained" | "Outdoor";
  patch: Partial<Conditions>;
}

const k = (p: Partial<Conditions["kitchen"]>): Conditions["kitchen"] => ({
  ovens: 1,
  burners: 4,
  grill: false,
  dishwasher: true,
  fridge: "normal",
  counter: "medium",
  seats: 8,
  ...p,
});

/** Curated starting conditions. Each one is a real hosting situation, not a demo. */
export const SCENARIOS: Scenario[] = [
  {
    id: "winter-eight",
    label: "Winter table for eight",
    note: "Seated · one oven · one helper",
    family: "Table",
    patch: { label: "Winter table for eight", shape: "dinner", style: "seated", guests: 8, helpers: 1, prepWindowH: 5, ambition: 2, diets: [], season: "winter", budgetTier: 2, kids: false, outdoor: false, leftovers: "some", serviceTime: "19:00", kitchen: k({}) },
  },
  {
    id: "tiny-six",
    label: "Small-kitchen supper for six",
    note: "No dishwasher · two burners · tight fridge",
    family: "Constrained",
    patch: { label: "Small-kitchen supper for six", shape: "dinner", style: "seated", guests: 6, helpers: 0, prepWindowH: 3, ambition: 1, diets: [], season: "autumn", budgetTier: 1, kids: false, outdoor: false, leftovers: "none", serviceTime: "19:30", kitchen: k({ burners: 2, dishwasher: false, fridge: "tight", counter: "small", seats: 6 }) },
  },
  {
    id: "reception-eighteen",
    label: "Standing reception for eighteen",
    note: "Grazing · plant-only · no oven pressure",
    family: "Crowd",
    patch: { label: "Standing reception for eighteen", shape: "reception", style: "grazing", guests: 18, helpers: 2, prepWindowH: 6, ambition: 2, diets: ["no-animal"], season: "summer", budgetTier: 2, kids: false, outdoor: true, leftovers: "deliberate", serviceTime: "18:00", kitchen: k({ fridge: "roomy", counter: "large", seats: 6 }) },
  },
  {
    id: "sunday-lunch",
    label: "Sunday lunch, three generations",
    note: "Seated · children present · deliberate leftovers",
    family: "Table",
    patch: { label: "Sunday lunch", shape: "dinner", style: "seated", guests: 10, helpers: 2, prepWindowH: 4, ambition: 2, diets: [], season: "autumn", budgetTier: 2, kids: true, outdoor: false, leftovers: "deliberate", serviceTime: "13:30", kitchen: k({ seats: 10, fridge: "roomy" }) },
  },
  {
    id: "summer-cookout",
    label: "Summer cookout for fourteen",
    note: "Grill declared · outdoor · buffet",
    family: "Outdoor",
    patch: { label: "Summer cookout", shape: "cookout", style: "buffet", guests: 14, helpers: 1, prepWindowH: 5, ambition: 2, diets: [], season: "summer", budgetTier: 2, kids: true, outdoor: true, leftovers: "some", serviceTime: "17:00", kitchen: k({ grill: true, counter: "large", seats: 8 }) },
  },
  {
    id: "brunch-twelve",
    label: "Late brunch for twelve",
    note: "Buffet · one oven · short window",
    family: "Crowd",
    patch: { label: "Late brunch", shape: "brunch", style: "buffet", guests: 12, helpers: 1, prepWindowH: 3, ambition: 2, diets: [], season: "spring", budgetTier: 2, kids: true, outdoor: false, leftovers: "some", serviceTime: "11:30", kitchen: k({ seats: 8 }) },
  },
  {
    id: "aperitivo-ten",
    label: "Aperitivo hour for ten",
    note: "Standing · boards led · alcohol-free option equal status",
    family: "Crowd",
    patch: { label: "Aperitivo hour", shape: "aperitivo", style: "cocktail", guests: 10, helpers: 0, prepWindowH: 2, ambition: 1, diets: [], season: "summer", budgetTier: 2, kids: false, outdoor: true, leftovers: "none", serviceTime: "18:30", kitchen: k({ seats: 4, counter: "small" }) },
  },
  {
    id: "gluten-free-table",
    label: "Gluten-avoiding table for eight",
    note: "Seated · filtered route · no silent substitutions",
    family: "Table",
    patch: { label: "Gluten-avoiding table", shape: "dinner", style: "seated", guests: 8, helpers: 1, prepWindowH: 5, ambition: 2, diets: ["no-gluten"], season: "year-round", budgetTier: 2, kids: false, outdoor: false, leftovers: "some", serviceTime: "19:00", kitchen: k({}) },
  },
  {
    id: "vegetarian-twelve",
    label: "Vegetarian buffet for twelve",
    note: "No meat · two burners · roomy cold storage",
    family: "Crowd",
    patch: { label: "Vegetarian buffet", shape: "dinner", style: "buffet", guests: 12, helpers: 1, prepWindowH: 5, ambition: 3, diets: ["no-meat"], season: "spring", budgetTier: 2, kids: false, outdoor: false, leftovers: "some", serviceTime: "19:00", kitchen: k({ burners: 2, fridge: "roomy", seats: 8 }) },
  },
  {
    id: "solo-host-six",
    label: "Solo host, weeknight six",
    note: "No helpers · two-hour window · restrained",
    family: "Constrained",
    patch: { label: "Weeknight six", shape: "dinner", style: "seated", guests: 6, helpers: 0, prepWindowH: 2, ambition: 1, diets: [], season: "year-round", budgetTier: 1, kids: false, outdoor: false, leftovers: "none", serviceTime: "19:30", kitchen: k({ seats: 6, counter: "small" }) },
  },
  {
    id: "no-oven-flat",
    label: "No-oven flat, eight standing",
    note: "Zero ovens · cold and stovetop routes only",
    family: "Constrained",
    patch: { label: "No-oven flat", shape: "reception", style: "grazing", guests: 8, helpers: 0, prepWindowH: 3, ambition: 1, diets: [], season: "summer", budgetTier: 1, kids: false, outdoor: false, leftovers: "none", serviceTime: "19:00", kitchen: k({ ovens: 0, burners: 2, dishwasher: false, fridge: "tight", counter: "small", seats: 4 }) },
  },
  {
    id: "celebration-twenty",
    label: "Celebration for twenty",
    note: "Full table · two ovens · three helpers",
    family: "Crowd",
    patch: { label: "Celebration for twenty", shape: "dinner", style: "buffet", guests: 20, helpers: 3, prepWindowH: 7, ambition: 3, diets: [], season: "winter", budgetTier: 3, kids: false, outdoor: false, leftovers: "deliberate", serviceTime: "19:30", kitchen: k({ ovens: 2, burners: 6, fridge: "roomy", counter: "large", seats: 12 }) },
  },
  {
    id: "two-course-weeknight",
    label: "Two courses, Tuesday, four",
    note: "Short window · plated · nothing held over",
    family: "Table",
    patch: { label: "Two courses, Tuesday", shape: "dinner", style: "seated", guests: 4, helpers: 0, prepWindowH: 2, ambition: 1, diets: [], season: "year-round", budgetTier: 1, kids: false, outdoor: false, leftovers: "none", serviceTime: "19:00", kitchen: k({ seats: 4 }), ops: o({ table: { tables: 1, seatsPerTable: 4, courses: 2, serviceMode: "plated", tablesideFinishing: false } }) },
  },
  {
    id: "five-course-eight",
    label: "Five courses for eight",
    note: "Plated · practised hands · long window",
    family: "Table",
    patch: { label: "Five courses for eight", shape: "dinner", style: "seated", guests: 8, helpers: 1, prepWindowH: 7, ambition: 3, diets: [], season: "winter", budgetTier: 3, kids: false, outdoor: false, leftovers: "none", serviceTime: "19:30", kitchen: k({ ovens: 2 }), ops: o({ table: { tables: 1, seatsPerTable: 8, courses: 5, serviceMode: "plated", tablesideFinishing: true }, general: { skill: 3, alcohol: true, serviceDurationMin: 210, cleanupWindowMin: 90, dietStrictness: "preference" } }) },
  },
  {
    id: "two-tables-fourteen",
    label: "Two tables, fourteen seated",
    note: "Family style · split service · one oven",
    family: "Table",
    patch: { label: "Two tables of seven", shape: "dinner", style: "seated", guests: 14, helpers: 2, prepWindowH: 5, ambition: 2, diets: [], season: "autumn", budgetTier: 2, kids: true, outdoor: false, leftovers: "some", serviceTime: "18:30", kitchen: k({ seats: 14 }), ops: o({ table: { tables: 2, seatsPerTable: 7, courses: 3, serviceMode: "family", tablesideFinishing: false } }) },
  },
  {
    id: "birthday-lunch-nine",
    label: "Birthday lunch for nine",
    note: "Sweet course carries the room · midday",
    family: "Table",
    patch: { label: "Birthday lunch", shape: "dinner", style: "seated", guests: 9, helpers: 1, prepWindowH: 4, ambition: 2, diets: [], season: "spring", budgetTier: 2, kids: true, outdoor: false, leftovers: "some", serviceTime: "12:30", kitchen: k({ seats: 10 }), ops: o({ table: { tables: 1, seatsPerTable: 10, courses: 4, serviceMode: "family", tablesideFinishing: false } }) },
  },
  {
    id: "alcohol-free-table",
    label: "Alcohol-free table for ten",
    note: "Zero-proof is the main pour, not the fallback",
    family: "Table",
    patch: { label: "Alcohol-free table", shape: "dinner", style: "seated", guests: 10, helpers: 1, prepWindowH: 4, ambition: 2, diets: [], season: "summer", budgetTier: 2, kids: false, outdoor: false, leftovers: "some", serviceTime: "19:00", kitchen: k({ seats: 10 }), ops: o({ general: { skill: 2, alcohol: false, serviceDurationMin: 150, cleanupWindowMin: 60, dietStrictness: "preference" } }) },
  },
  {
    id: "strict-avoidance-six",
    label: "Strict avoidance, table of six",
    note: "Separate boards · nut and gluten routes kept apart",
    family: "Table",
    patch: { label: "Strict avoidance table", shape: "dinner", style: "seated", guests: 6, helpers: 1, prepWindowH: 5, ambition: 2, diets: ["no-gluten", "no-nut"], season: "year-round", budgetTier: 2, kids: false, outdoor: false, leftovers: "none", serviceTime: "19:00", kitchen: k({ seats: 6 }), ops: o({ general: { skill: 2, alcohol: true, serviceDurationMin: 150, cleanupWindowMin: 60, dietStrictness: "strict" } }) },
  },
  {
    id: "open-house-thirty",
    label: "Open house for thirty",
    note: "Three-hour arrival spread · three stations",
    family: "Crowd",
    patch: { label: "Open house", shape: "reception", style: "grazing", guests: 30, helpers: 3, prepWindowH: 6, ambition: 2, diets: [], season: "winter", budgetTier: 2, kids: true, outdoor: false, leftovers: "deliberate", serviceTime: "16:00", kitchen: k({ ovens: 1, fridge: "roomy", counter: "large", seats: 8 }), ops: o({ crowd: { standingShare: 0.8, arrivalSpreadMin: 180, stations: 3, selfServe: true, refillCadenceMin: 30 } }) },
  },
  {
    id: "drinks-and-boards-sixteen",
    label: "Drinks and boards for sixteen",
    note: "Cocktail · one station · self-serve",
    family: "Crowd",
    patch: { label: "Drinks and boards", shape: "aperitivo", style: "cocktail", guests: 16, helpers: 1, prepWindowH: 3, ambition: 1, diets: [], season: "autumn", budgetTier: 2, kids: false, outdoor: false, leftovers: "none", serviceTime: "18:30", kitchen: k({ counter: "large", seats: 6 }), ops: o({ crowd: { standingShare: 0.9, arrivalSpreadMin: 45, stations: 1, selfServe: true, refillCadenceMin: 20 } }) },
  },
  {
    id: "office-lunch-twenty-five",
    label: "Working lunch for twenty-five",
    note: "Buffet · one hour of service · fast turnover",
    family: "Crowd",
    patch: { label: "Working lunch", shape: "brunch", style: "buffet", guests: 25, helpers: 2, prepWindowH: 4, ambition: 1, diets: ["no-meat"], season: "year-round", budgetTier: 2, kids: false, outdoor: false, leftovers: "none", serviceTime: "12:30", kitchen: k({ fridge: "roomy", counter: "large", seats: 12 }), ops: o({ crowd: { standingShare: 0.4, arrivalSpreadMin: 15, stations: 2, selfServe: true, refillCadenceMin: 20 }, general: { skill: 2, alcohol: false, serviceDurationMin: 60, cleanupWindowMin: 45, dietStrictness: "preference" } }) },
  },
  {
    id: "wake-lunch-forty",
    label: "Gathering for forty",
    note: "Grazing · long arrival · everything holds",
    family: "Crowd",
    patch: { label: "Gathering for forty", shape: "reception", style: "grazing", guests: 40, helpers: 4, prepWindowH: 6, ambition: 1, diets: [], season: "year-round", budgetTier: 2, kids: true, outdoor: false, leftovers: "deliberate", serviceTime: "14:00", kitchen: k({ ovens: 2, burners: 6, fridge: "roomy", counter: "large", seats: 20 }), ops: o({ crowd: { standingShare: 0.6, arrivalSpreadMin: 120, stations: 3, selfServe: true, refillCadenceMin: 40 } }) },
  },
  {
    id: "late-supper-eighteen",
    label: "Late supper after the show",
    note: "Buffet at eleven · everything made ahead",
    family: "Crowd",
    patch: { label: "Late supper", shape: "dinner", style: "buffet", guests: 18, helpers: 1, prepWindowH: 3, ambition: 2, diets: [], season: "autumn", budgetTier: 2, kids: false, outdoor: false, leftovers: "some", serviceTime: "23:00", kitchen: k({ fridge: "roomy", seats: 8 }), ops: o({ constraint: { sink: "single", prepSurfaces: 2, singleBurnerMode: false, noOvenMode: false, coldBoxes: 1, powerLimited: false, curfew: true, shoppingTrips: 1, pantryOnly: false, hardCapPerHead: null } }) },
  },
  {
    id: "kids-party-twenty",
    label: "Children's party for twenty",
    note: "Ten children · handheld · nothing sharp or hot",
    family: "Crowd",
    patch: { label: "Children's party", shape: "reception", style: "buffet", guests: 20, helpers: 2, prepWindowH: 3, ambition: 1, diets: ["no-nut"], season: "summer", budgetTier: 1, kids: true, outdoor: true, leftovers: "some", serviceTime: "15:00", kitchen: k({ counter: "medium", seats: 10 }), ops: o({ crowd: { standingShare: 0.7, arrivalSpreadMin: 30, stations: 2, selfServe: true, refillCadenceMin: 20 }, general: { skill: 2, alcohol: false, serviceDurationMin: 120, cleanupWindowMin: 45, dietStrictness: "strict" } }) },
  },
  {
    id: "single-burner-four",
    label: "One burner, four at the table",
    note: "No oven · single ring · one pan sequence",
    family: "Constrained",
    patch: { label: "One burner supper", shape: "dinner", style: "seated", guests: 4, helpers: 0, prepWindowH: 2, ambition: 1, diets: [], season: "year-round", budgetTier: 1, kids: false, outdoor: false, leftovers: "none", serviceTime: "19:30", kitchen: k({ ovens: 0, burners: 1, dishwasher: false, fridge: "tight", counter: "small", seats: 4 }), ops: o({ constraint: { sink: "scarce", prepSurfaces: 1, singleBurnerMode: true, noOvenMode: true, coldBoxes: 0, powerLimited: false, curfew: false, shoppingTrips: 1, pantryOnly: false, hardCapPerHead: null } }) },
  },
  {
    id: "pantry-only-six",
    label: "Pantry only, six at short notice",
    note: "No shopping trip · store cupboard route",
    family: "Constrained",
    patch: { label: "Pantry only", shape: "dinner", style: "seated", guests: 6, helpers: 0, prepWindowH: 2, ambition: 1, diets: [], season: "year-round", budgetTier: 1, kids: false, outdoor: false, leftovers: "none", serviceTime: "19:00", kitchen: k({ fridge: "tight", counter: "small", seats: 6 }), ops: o({ constraint: { sink: "single", prepSurfaces: 1, singleBurnerMode: false, noOvenMode: false, coldBoxes: 0, powerLimited: false, curfew: false, shoppingTrips: 1, pantryOnly: true, hardCapPerHead: 6 } }) },
  },
  {
    id: "hard-cap-twelve",
    label: "Twelve on a hard cap",
    note: "Strict per-head ceiling · cap is a stop, not a hint",
    family: "Constrained",
    patch: { label: "Twelve on a cap", shape: "dinner", style: "buffet", guests: 12, helpers: 1, prepWindowH: 4, ambition: 1, diets: [], season: "winter", budgetTier: 1, kids: true, outdoor: false, leftovers: "deliberate", serviceTime: "18:00", kitchen: k({ seats: 8 }), ops: o({ constraint: { sink: "single", prepSurfaces: 2, singleBurnerMode: false, noOvenMode: false, coldBoxes: 0, powerLimited: false, curfew: false, shoppingTrips: 1, pantryOnly: false, hardCapPerHead: 5 } }) },
  },
  {
    id: "borrowed-kitchen-fifteen",
    label: "Borrowed kitchen, fifteen guests",
    note: "Limited power · scarce sink · curfew at eleven",
    family: "Constrained",
    patch: { label: "Borrowed kitchen", shape: "reception", style: "grazing", guests: 15, helpers: 1, prepWindowH: 3, ambition: 2, diets: [], season: "spring", budgetTier: 2, kids: false, outdoor: false, leftovers: "none", serviceTime: "19:00", kitchen: k({ dishwasher: false, fridge: "tight", counter: "small", seats: 4 }), ops: o({ constraint: { sink: "scarce", prepSurfaces: 1, singleBurnerMode: false, noOvenMode: false, coldBoxes: 2, powerLimited: true, curfew: true, shoppingTrips: 1, pantryOnly: false, hardCapPerHead: null } }) },
  },
  {
    id: "no-fridge-space-ten",
    label: "Full fridge already, ten coming",
    note: "Cold storage is the binding constraint",
    family: "Constrained",
    patch: { label: "No fridge space", shape: "dinner", style: "buffet", guests: 10, helpers: 0, prepWindowH: 4, ambition: 2, diets: [], season: "summer", budgetTier: 2, kids: false, outdoor: false, leftovers: "none", serviceTime: "19:00", kitchen: k({ fridge: "tight", counter: "medium", seats: 8 }), ops: o({ constraint: { sink: "single", prepSurfaces: 2, singleBurnerMode: false, noOvenMode: false, coldBoxes: 1, powerLimited: false, curfew: false, shoppingTrips: 2, pantryOnly: false, hardCapPerHead: null } }) },
  },
  {
    id: "cautious-first-time",
    label: "First time hosting, eight",
    note: "Cautious pace · every estimate multiplied",
    family: "Constrained",
    patch: { label: "First time hosting", shape: "dinner", style: "seated", guests: 8, helpers: 1, prepWindowH: 5, ambition: 1, diets: [], season: "year-round", budgetTier: 2, kids: false, outdoor: false, leftovers: "some", serviceTime: "19:00", kitchen: k({}), ops: o({ general: { skill: 1, alcohol: true, serviceDurationMin: 120, cleanupWindowMin: 90, dietStrictness: "preference" }, table: { tables: 1, seatsPerTable: 8, courses: 2, serviceMode: "family", tablesideFinishing: false } }) },
  },
  {
    id: "charcoal-twelve",
    label: "Charcoal grill, twelve outdoors",
    note: "Live fire · no outdoor water · high sun",
    family: "Outdoor",
    patch: { label: "Charcoal for twelve", shape: "cookout", style: "buffet", guests: 12, helpers: 1, prepWindowH: 4, ambition: 2, diets: [], season: "summer", budgetTier: 2, kids: true, outdoor: true, leftovers: "some", serviceTime: "17:30", kitchen: k({ grill: true, counter: "medium", seats: 8 }), ops: o({ outdoor: { grillType: "charcoal", smoker: false, firePit: false, power: false, water: false, shade: false, weatherRisk: "medium", transportMin: 0, coolerCapacity: 6, insectPressure: true } }) },
  },
  {
    id: "smoker-long-day",
    label: "Smoker, long day, sixteen",
    note: "Low and slow · eight-hour lead · shade required",
    family: "Outdoor",
    patch: { label: "Smoker day", shape: "cookout", style: "buffet", guests: 16, helpers: 2, prepWindowH: 8, ambition: 3, diets: [], season: "summer", budgetTier: 3, kids: true, outdoor: true, leftovers: "deliberate", serviceTime: "17:00", kitchen: k({ grill: true, fridge: "roomy", counter: "large", seats: 10 }), ops: o({ outdoor: { grillType: "charcoal", smoker: true, firePit: false, power: true, water: true, shade: true, weatherRisk: "low", transportMin: 0, coolerCapacity: 10, insectPressure: true } }) },
  },
  {
    id: "picnic-transport",
    label: "Picnic for ten, carried in",
    note: "Forty minutes of transport · no heat on site",
    family: "Outdoor",
    patch: { label: "Carried picnic", shape: "reception", style: "grazing", guests: 10, helpers: 1, prepWindowH: 3, ambition: 1, diets: [], season: "spring", budgetTier: 1, kids: true, outdoor: true, leftovers: "none", serviceTime: "13:00", kitchen: k({ counter: "medium", seats: 0 }), ops: o({ outdoor: { grillType: "none", smoker: false, firePit: false, power: false, water: false, shade: false, weatherRisk: "medium", transportMin: 40, coolerCapacity: 8, insectPressure: true } }) },
  },
  {
    id: "terrace-dinner-eight",
    label: "Terrace dinner for eight",
    note: "Seated outside · weather risk high · indoor fallback",
    family: "Outdoor",
    patch: { label: "Terrace dinner", shape: "dinner", style: "seated", guests: 8, helpers: 1, prepWindowH: 5, ambition: 2, diets: [], season: "autumn", budgetTier: 2, kids: false, outdoor: true, leftovers: "some", serviceTime: "19:00", kitchen: k({ seats: 8 }), ops: o({ outdoor: { grillType: "gas", smoker: false, firePit: true, power: true, water: false, shade: true, weatherRisk: "high", transportMin: 10, coolerCapacity: 4, insectPressure: true }, table: { tables: 1, seatsPerTable: 8, courses: 3, serviceMode: "family", tablesideFinishing: false } }) },
  },
  {
    id: "fire-pit-late",
    label: "Fire pit, late, twelve standing",
    note: "Cold buffet inside · fire outside · curfew",
    family: "Outdoor",
    patch: { label: "Fire pit night", shape: "reception", style: "grazing", guests: 12, helpers: 1, prepWindowH: 3, ambition: 1, diets: [], season: "winter", budgetTier: 2, kids: false, outdoor: true, leftovers: "none", serviceTime: "20:00", kitchen: k({ counter: "medium", seats: 6 }), ops: o({ outdoor: { grillType: "none", smoker: false, firePit: true, power: true, water: false, shade: true, weatherRisk: "medium", transportMin: 5, coolerCapacity: 2, insectPressure: false }, constraint: { sink: "single", prepSurfaces: 2, singleBurnerMode: false, noOvenMode: false, coldBoxes: 1, powerLimited: false, curfew: true, shoppingTrips: 2, pantryOnly: false, hardCapPerHead: null } }) },
  },
];

