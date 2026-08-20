/**
 * First-party map from planner dishes / occasions back to saltnotes.blog.
 * URLs are published WordPress destinations. Matching is editorial, not search.
 */

export const HOUSE_ORIGIN = "https://saltnotes.blog";
export const READING_DESK_PATH = "/reading-desk/";
export const READING_DESK_URL = `${HOUSE_ORIGIN}${READING_DESK_PATH}`;

export type ReadingKind = "house" | "hosting" | "recipe" | "drink" | "essay" | "menu";

export type ReadingPiece = {
  id: string;
  title: string;
  url: string;
  kind: ReadingKind;
  /** Dish ids, course names, occasion slugs, or loose tokens used for matching. */
  tags: string[];
};

export type HouseDesk = {
  id: string;
  title: string;
  url: string;
  note: string;
};

export const HOUSE_DESKS: HouseDesk[] = [
  {
    id: "home",
    title: "Salty & Clever",
    url: `${HOUSE_ORIGIN}/`,
    note: "The house. Essays, recipes, and the desks live here.",
  },
  {
    id: "start",
    title: "Start with the Meal",
    url: `${HOUSE_ORIGIN}/start-here/`,
    note: "If you arrived from a tool, begin with the meal, not the gadget.",
  },
  {
    id: "oos",
    title: "Occasion Operating System",
    url: `${HOUSE_ORIGIN}/occasion-operating-system/`,
    note: "The editorial door into the planner — and the door back out.",
  },
  {
    id: "scene",
    title: "Dressed for Dinner",
    url: `${HOUSE_ORIGIN}/dressed-for-dinner/`,
    note: "When you have a mood and no menu yet.",
  },
  {
    id: "hosting",
    title: "Hosting and Service",
    url: `${HOUSE_ORIGIN}/hosting/`,
    note: "Service writing: last thirty minutes, sideboards, family-style.",
  },
  {
    id: "recipes",
    title: "Recipes and Technique",
    url: `${HOUSE_ORIGIN}/recipes/`,
    note: "Recipes with a job, not a mood board.",
  },
  {
    id: "drinks",
    title: "Drinks and Zero-Proof",
    url: `${HOUSE_ORIGIN}/drinks/`,
    note: "The One Drink and the No-Drink. Equal status, both routes.",
  },
  {
    id: "menus",
    title: "Menus & Kitchen Systems",
    url: `${HOUSE_ORIGIN}/menus/`,
    note: "How a menu is supposed to behave under pressure.",
  },
];

export const HOUSE_APPS = [
  {
    id: "oos-app",
    title: "Occasion OS",
    url: "https://occasion.saltnotes.blog/",
    note: "Plan the night you can actually host.",
  },
  {
    id: "architecture-app",
    title: "Compose",
    url: "https://occasion.saltnotes.blog/architecture",
    note: "Five roles, stress meters, a bounded packet.",
  },
  {
    id: "deepdish",
    title: "Restaurant Intelligence",
    url: "https://deepdish.saltnotes.blog/",
    note: "When the correct route is: do not host.",
  },
] as const;

const post = (slug: string, title: string, kind: ReadingKind, tags: string[]): ReadingPiece => ({
  id: slug,
  title,
  url: `${HOUSE_ORIGIN}/${slug}/`,
  kind,
  tags,
});

/** Curated, published pieces. Tags are how a plan finds its way home. */
export const READING_PIECES: ReadingPiece[] = [
  post("family-style-without-table-traffic-jam", "Family-Style Without the Table Traffic Jam", "hosting", [
    "seated",
    "family_style",
    "dinner",
    "anchor",
    "side",
    "board",
    "roast-chicken",
    "sheet-pan-lemon-chicken",
    "braise-short-rib",
    "braised-short-ribs",
  ]),
  post("build-menu-around-last-30-minutes", "Build the Menu Around the Last 30 Minutes", "hosting", [
    "dinner",
    "weeknight",
    "anchor",
    "event-day",
    "sheet-pan-lemon-chicken",
    "roast-chicken",
    "shakshuka",
    "baked-pasta",
  ]),
  post("sideboard-service-tool-not-furniture-prop", "The Sideboard Is a Service Tool, Not a Furniture Prop", "hosting", [
    "buffet",
    "grazing",
    "board",
    "reception",
    "side",
    "cw-board-antipasti-long",
    "pickled-veg-board",
  ]),
  post("garnish-should-not-become-shift", "A Garnish Should Not Become a Shift", "hosting", [
    "attention",
    "low",
    "weeknight",
    "simple-green-salad",
    "bitter-greens-salad",
  ]),
  post("coffee-tea-service-without-second-kitchen-shift", "Perfect Coffee Timing for Dinner Parties", "hosting", [
    "sweet",
    "affogato-bar",
    "drink",
    "dinner",
  ]),
  post("how-to-design-around-a-dish-everyone-insists-must-be-served", "How to Design Around a Dish Everyone Insists Must Be Served", "essay", [
    "locked",
    "anchor",
    "porchetta-style-pork",
    "braised-short-ribs",
    "braise-short-rib",
  ]),
  post("searing-and-crust", "Searing and Crust: Dry Surface, Hot Pan, Leave It Alone", "recipe", [
    "anchor",
    "roast-chicken",
    "sheet-pan-lemon-chicken",
    "porchetta-style-pork",
    "braise-short-rib",
    "grilled-shrimp-skewers",
    "grilled-halloumi",
  ]),
  post("crisp-creamy-coleslaw-celery-seed-pickle-brine", "Crisp Creamy Coleslaw with Celery Seed and Pickle Brine", "recipe", [
    "kimchi-slaw",
    "cw-side-bulk-coleslaw",
    "cn-pantry-slaw",
    "side",
    "cookout",
    "slaw",
  ]),
  post("tide-turner-salmon-with-chile-lime-yogurt-and-crispy-chickpeas", "Tide-Turner Salmon with Chile-Lime Yogurt and Crispy Chickpeas", "recipe", [
    "miso-glazed-salmon",
    "fish",
    "anchor",
  ]),
  post("lantern-lit-black-cod-miso-pear-mustard-greens", "Lantern-Lit Black Cod with Miso, Pear, and Mustard Greens", "recipe", [
    "miso-glazed-salmon",
    "fish",
  ]),
  post("harbor-toasts-sardines-roasted-grapes-labneh", "Harbor Toasts with Sardines, Roasted Grapes, and Black-Pepper Labneh", "recipe", [
    "board",
    "starter",
    "aperitivo",
    "whipped-feta-honey",
    "citrus-olives",
  ]),
  post("vegan-plum-sorbet-ginger-black-pepper", "Vegan Plum Sorbet with Ginger and Black Pepper", "recipe", [
    "stone-fruit-crumble",
    "honey-roasted-fruit",
    "sweet",
    "no-animal",
  ]),
  post("black-sesame-ice-cream-salted-honey", "Black Sesame Ice Cream with Salted Honey", "recipe", [
    "sweet",
    "citrus-posset",
    "chocolate-olive-oil-cake",
    "affogato-bar",
  ]),
  post("cold-feet-semifreddo-espresso-hazelnut-salted-chocolate", "Cold Feet Semifreddo with Espresso, Hazelnut, and Salted Chocolate", "recipe", [
    "chocolate-olive-oil-cake",
    "affogato-bar",
    "sweet",
  ]),
  post("dial-up-martini-a-lychee-yuzu-and-chrome-glass-cocktail-hour", "Dial-Up Martini: A Lychee, Yuzu, and Chrome-Glass Cocktail Hour", "drink", [
    "drink",
    "cocktail",
    "reception",
    "both",
    "alcoholic",
    "zero_proof",
  ]),
  post("soft-alibi-white-peach-jasmine-tea-verjus", "Soft Alibi: White Peach, Jasmine Tea, Verjus, and Pink Pepper Fizz", "drink", [
    "drink",
    "zero_proof",
    "zero-proof",
    "no-alcohol",
    "cocktail",
  ]),
  post("chilled-einspanner-recipe-a-summer-delight", "Chilled Einspänner Recipe", "drink", [
    "affogato-bar",
    "sweet",
    "drink",
    "brunch",
  ]),
  post("via-veneto-at-midnight-cocktail-dinner-menu", "Via Veneto at Midnight: A Bergamot, Prosecco, and Flashbulb Cocktail Dinner", "menu", [
    "cocktail",
    "reception",
    "aperitivo",
    "drink",
  ]),
  post("the-tiny-chef-took-over-three-menus-drinks-dessert-and-kitchen-kit", "The Tiny Chef Took Over — Three Menus, Drinks, Dessert, and Kitchen Kit", "menu", [
    "dinner",
    "weeknight",
    "small",
  ]),
];

export type ReadingSubject = {
  dishIds?: string[];
  names?: string[];
  courses?: string[];
  shapes?: string[];
  occasion?: string;
  beverage?: string;
  serviceStyle?: string;
  locked?: boolean;
};

function tokensOf(subject: ReadingSubject): Set<string> {
  const out = new Set<string>();
  const push = (value: string | undefined) => {
    if (!value) return;
    const raw = value.toLowerCase().trim();
    if (!raw) return;
    out.add(raw);
    for (const part of raw.split(/[^a-z0-9]+/)) {
      if (part.length > 2) out.add(part);
    }
  };
  for (const id of subject.dishIds ?? []) push(id);
  for (const name of subject.names ?? []) push(name);
  for (const course of subject.courses ?? []) push(course);
  for (const shape of subject.shapes ?? []) push(shape);
  push(subject.occasion);
  push(subject.beverage);
  push(subject.serviceStyle);
  if (subject.locked) out.add("locked");
  return out;
}

export function matchReading(subject: ReadingSubject, limit = 6): ReadingPiece[] {
  const tokens = tokensOf(subject);
  const scored = READING_PIECES.map((piece) => {
    let score = 0;
    for (const tag of piece.tags) {
      if (tokens.has(tag.toLowerCase())) score += tag.includes("-") ? 3 : 2;
    }
    if (piece.kind === "hosting" && (tokens.has("dinner") || tokens.has("seated"))) score += 1;
    if (piece.kind === "drink" && (tokens.has("drink") || tokens.has("cocktail") || tokens.has("zero_proof"))) {
      score += 1;
    }
    return { piece, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked: ReadingPiece[] = [];
  const seen = new Set<string>();
  for (const row of scored) {
    if (seen.has(row.piece.id)) continue;
    seen.add(row.piece.id);
    picked.push(row.piece);
    if (picked.length >= limit) break;
  }

  const fallback: ReadingPiece[] = [
    {
      id: "hosting-desk",
      title: "Hosting and Service",
      url: `${HOUSE_ORIGIN}/hosting/`,
      kind: "house",
      tags: [],
    },
    {
      id: "recipes-desk",
      title: "Recipes and Technique",
      url: `${HOUSE_ORIGIN}/recipes/`,
      kind: "house",
      tags: [],
    },
  ];
  for (const piece of fallback) {
    if (picked.length >= Math.max(3, Math.min(limit, 6))) break;
    if (seen.has(piece.id)) continue;
    picked.push(piece);
  }
  return picked;
}

export function editorialUrlForDish(dishId: string, name?: string): string | null {
  const [first] = matchReading({ dishIds: [dishId], names: name ? [name] : [] }, 1);
  if (!first || first.kind === "house") return null;
  return first.url;
}
