import type { Conditions } from "./types";

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
];
