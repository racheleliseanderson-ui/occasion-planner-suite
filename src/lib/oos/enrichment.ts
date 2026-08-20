import type { Dish } from "./types";

/** Pairing overlay keyed by dish id. Educational planning notes — not sommelier certification. */
export interface DishEnrichment {
  winePairing?: string;
  leftoverNote?: string;
  pairingWhy?: string;
}

/**
 * Wine and leftover notes mapped onto first-party fixtures.
 * Why-logic is acid cuts fat, texture contrast, or season fit — never trend.
 */
export const DISH_ENRICHMENT: Record<string, DishEnrichment> = {
  "tb-clam-linguine": {
    pairingWhy: "Acid cuts fat; brine meets brine",
    winePairing:
      "Muscadet, Albariño, or Vermentino. High acid and saline minerality cut the pasta fat and amplify the clam liquor. Finish the pan with a splash of the wine you are pouring. Bottle math: 0.4 bottle/head seated; chill is the constraint, not the cork.",
    leftoverNote:
      "Strain remaining liquor, chill, and turn into a cold seafood pasta or a warm broth the next day. Do not re-boil the clams.",
  },
  "braise-short-rib": {
    pairingWhy: "Acid and tannin cut collagen-rich fat",
    winePairing:
      "Chianti Classico, cool-climate Syrah, or a modest Bordeaux. Acid and modest tannin cut the braise fat without fighting overnight gelatin. One bottle covers four to five seated; keep a second for the table, not the pot.",
    leftoverNote:
      "Chill overnight, lift the fat, shred cold. Warm in its jelly on charred bread with sharp greens. Do not recook to grey.",
  },
  "roast-chicken": {
    pairingWhy: "Texture contrast; light acid against crisp skin",
    winePairing:
      "Dry cider, Chablis, or a quiet Pinot Blanc. Acid and a little grip against lemon and skin; nothing heavier than the bird. Chill the cider like a white.",
    leftoverNote:
      "Pick the bird cold. Dress leftover grains or bread with lemon and oil. The carcass is stock, not a second roast.",
  },
  "baked-pasta": {
    pairingWhy: "Acid and structure cut dairy and tomato",
    winePairing:
      "Chianti or Sangiovese. Tomato acid already on the plate wants a red with similar lift, not a heavy New World pour. Two bottles for eight is a planning count.",
    leftoverNote:
      "Cold slices pan-fry as a pasta frittata: eggs, the pasta, a hot skillet, lid on. Do not add more sauce.",
  },
  "chickpea-tagine": {
    pairingWhy: "Season fit; spice wants fruit, not oak",
    winePairing:
      "Dry rosé or a modest Grenache. Fruit and acid against spice and squash; skip oak. Equal-status zero-proof: bitter orange shrub over ice.",
    leftoverNote:
      "Drain a little liquid, stuff leftover bread, crisp in a dry pan. The stew also thins into a next-day soup.",
  },
  "grill-skewers": {
    pairingWhy: "Char wants acid and a little chill",
    winePairing:
      "Dry rosé or light Gamay, served cool. Char and yoghurt marinade want lift, not tannin. Outdoor: keep bottles in the cooler, not the sun.",
    leftoverNote:
      "Chop cold, dress with yoghurt or oil and citrus, leftover herbs. Bread. Do not recook the chicken.",
  },
  "potato-gratin": {
    pairingWhy: "Acid cuts cream",
    winePairing:
      "Chablis, Aligoté, or a sharp Riesling. Cream needs acid more than body. If the anchor is red, keep a white on the table for this dish.",
    leftoverNote:
      "Cut cold into slabs and re-crisp in a hot pan. Do not microwave — it weeps.",
  },
  "green-salad": {
    pairingWhy: "Texture contrast; acid already on the plate",
    winePairing:
      "Whatever is open. The dressing is the pairing — lemon and oil. Do not add a sweet wine against a sharp salad.",
    leftoverNote:
      "Dressed greens do not keep. Undressed leaves and leftover vinaigrette are tomorrow's lunch.",
  },
  "grain-salad": {
    pairingWhy: "Season fit; herbs and grain want a cool pour",
    winePairing:
      "Vermentino or a dry Riesling. Herbs and grain want something cool and not oaky.",
    leftoverNote:
      "Improves cold overnight. Add extra lemon and oil the next day; do not reheat.",
  },
  "board-cured": {
    pairingWhy: "Salt and fat want bubbles or a light red",
    winePairing:
      "Dry sparkling, dry rosé, or a light Gamay. Salt and fat want bubbles or red fruit, not a heavy pour. Zero-proof: tonic and citrus, equal glassware.",
    leftoverNote:
      "Wrap tightly. Next day: fold into a grain salad or eat cold with leftover bread. Do not recook cured meat.",
  },
  "starter-shellfish": {
    pairingWhy: "Brine meets brine",
    winePairing:
      "Muscadet or Champagne. Ice is the constraint. Do not serve a buttery white against oysters.",
    leftoverNote:
      "There is no leftover route for raw shellfish. Eat them or discard them. Fail closed.",
  },
  "sweet-fridge-tart": {
    pairingWhy: "Bitter against sweet; skip dessert wine unless asked",
    winePairing:
      "A small pour of the table red, or coffee. If you want wine: a dry-ish Madeira or nothing. Do not default to sticky pudding wine.",
    leftoverNote:
      "Keeps two days cold. Serve colder, not warmer. A spoon of leftover citrus on top.",
  },
  "sweet-fruit": {
    pairingWhy: "Season fit; fruit is the pour",
    winePairing:
      "Moscato is optional, not required. Most tables want water and coffee. If pouring: a dry Riesling leftover from the main.",
    leftoverNote:
      "Holds overnight. Spoon over leftover cake or yoghurt. Do not recook the fruit.",
  },
  "drink-wine": {
    pairingWhy: "Counted, not guessed; chill is the constraint",
    winePairing:
      "0.42 bottle/guest is a planning count for a seated dinner with a second pour. For eight: three to four bottles of the pairing wine plus one fallback (sparkling or the zero-proof). White and rosé need fridge or ice — that capacity binds before the budget does.",
    leftoverNote:
      "Opened still wine keeps one day, recorked, cold. Use in the leftover pasta or the next sauce. Do not invent a second night of service from half bottles.",
  },
  "drink-zero": {
    pairingWhy: "Equal-status pour, not a fallback",
    winePairing:
      "Bitter-orange shrub, tonic and citrus, or a salted grapefruit soda. Serve in the same glass as the wine. Batch and chill. The zero-proof is the main pour on an alcohol-free table.",
    leftoverNote:
      "Shrub base keeps weeks. Sparkling water is opened per service. Do not recarbonate leftovers.",
  },
  "it-burrata-starter": {
    pairingWhy: "Season fit; fat wants dry rosé",
    winePairing:
      "Dry Provençal-style rosé. Acid and a little bitterness cut burrata fat; season fit for ripe tomatoes. Chill hard. One bottle for six as a welcome.",
    leftoverNote:
      "Burrata does not keep once cut. Use leftover tomatoes and bread as panzanella. Fail closed on the cheese.",
  },
  "tb-burrata-tomato": {
    pairingWhy: "Season fit; acid against cream",
    winePairing:
      "Dry rosé or a quiet Vermentino. Tomato acid and cream want a cold, dry pour — not oak, not sweetness.",
    leftoverNote:
      "Cut burrata is lunch, not a second dinner. Tomatoes and oil become bread salad.",
  },
  "it-panzanella-side": {
    pairingWhy: "Season fit; almost no heat",
    winePairing:
      "Dry rosé. Peak-summer tomatoes, bread, and oil want the same cold, dry pour as a terrace. Skip red.",
    leftoverNote:
      "Softens overnight and is still excellent cold. Add a splash of vinegar if it dulls. Do not reheat bread salad.",
  },
  "tb-scallop-crudo": {
    pairingWhy: "Texture contrast; acid against sweet shellfish",
    winePairing:
      "Chablis or Muscadet. Acid and a little reduction against brown butter or raw sweetness. Short active window — pour as you sear.",
    leftoverNote:
      "There is no leftover route for seared or raw scallops. Eat them. Fail closed.",
  },
  "tb-celeriac-puree": {
    pairingWhy: "Texture contrast against crisp skin or char",
    winePairing:
      "Light white or dry cider. Silky purée wants something with grip, not more cream.",
    leftoverNote:
      "Thins into next-day soup with stock and a squeeze of lemon. Do not re-reduce.",
  },
  "porchetta-shoulder": {
    pairingWhy: "Season fit; herb and fat want a dry cider or light Pinot",
    winePairing:
      "Dry cider or cool-climate Pinot. Sweet-savory pork and herbs want fruit and acid, not a tannic block. Bottle math: one cider per three guests plus a still white.",
    leftoverNote:
      "Slice cold for sandwiches with sharp greens and mustard. Reheat slices in a pan, not the oven.",
  },
  "charred-greens": {
    pairingWhy: "Bitter + sweet + fat",
    winePairing:
      "Light red (Gamay) or dry cider. Charred Brussels or greens want a little fruit against bitter. Nothing heavy.",
    leftoverNote:
      "Reheat in a hot pan with a splash of water. They improve. Do not microwave.",
  },
  "jp-milk-bread": {
    pairingWhy: "Texture; the bread is the main event",
    winePairing:
      "Tea, dry cider, or a quiet white. This is a toast table — keep the pour modest.",
    leftoverNote:
      "Stales into excellent next-day toast, cubes for eggs, or bread salad. Do not throw it.",
  },
  "olive-oil-cake": {
    pairingWhy: "Bitter cocoa or oil against fruit, not pudding wine",
    winePairing:
      "Coffee, or the last of the table red. A dry Madeira if you insist. Skip sticky dessert wine unless the table asks.",
    leftoverNote:
      "Wrap once cool. Toast a slice in a dry pan. Yoghurt and leftover fruit.",
  },
  "mx-carne-asada": {
    pairingWhy: "Char and acid; lime is already on the plate",
    winePairing:
      "Dry rosé, light Mexican lager, or a modest Tempranillo served cool. Lime and char want refreshment, not oak.",
    leftoverNote:
      "Slice cold. Rice, slaw, lime. Heat only the rice. Do not recook the beef.",
  },
  "soup-white-bean": {
    pairingWhy: "Two-burner honesty; a modest pour",
    winePairing:
      "A quiet Chianti or nothing. This is a constrained supper — do not add a wine service that needs a second fridge shelf.",
    leftoverNote:
      "Improves overnight. Thin with water, reheat gently. Toast is the second vegetable.",
  },
  "it-porcini-risotto": {
    pairingWhy: "Acid cuts butter and cheese",
    winePairing:
      "Barbera or a dry Soave. Risotto wants acid more than oak. Pour what you deglazed with, if it was wine.",
    leftoverNote:
      "Spread in a tray, chill, fry arancini-style cakes. Do not re-stir as risotto — it will glue.",
  },
  "tb-dauphinoise": {
    pairingWhy: "Acid cuts cream",
    winePairing:
      "Chablis or Aligoté. Same logic as gratin: cream needs acid.",
    leftoverNote:
      "Cold slabs, hot pan. Crisp the edges. Do not steam.",
  },
  "it-negroni-drink": {
    pairingWhy: "Bitter as structure",
    winePairing:
      "The Negroni is the pairing. Keep a zero-proof bitter-orange highball in the same glassware so the non-drinkers are not on sparkling water.",
    leftoverNote:
      "Batch keeps a day. Do not recarbonate. Garnish at pour.",
  },
};

export function applyEnrichment(dish: Dish): Dish {
  const extra = DISH_ENRICHMENT[dish.id];
  if (!extra) return dish;
  return {
    ...dish,
    winePairing: dish.winePairing ?? extra.winePairing,
    leftoverNote: dish.leftoverNote ?? extra.leftoverNote,
    pairingWhy: dish.pairingWhy ?? extra.pairingWhy,
  };
}
