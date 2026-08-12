// @ts-nocheck — mechanical port of SC-MB-001 engine; preserve formulas exactly.
/**
 * Dish catalog + deterministic flavor-family pairing for Menu Builder (SC-MB-001).
 *
 * Honesty boundary:
 * - Flavor families are curated planning tags, not molecular claims.
 * - Scores bias composition; they do not certify taste, allergen safety, or recipes.
 */

export const FLAVOR_FAMILIES = [
  'citrus',
  'allium',
  'green-herb',
  'fermented',
  'dairy-fat',
  'smoke',
  'spice-warm',
  'bitter-green',
  'stone-fruit',
  'chocolate',
  'umami-deep',
  'bright-acid',
  'nutty',
  'chile-heat',
  'floral',
  'grain-toasty',
  'tomato-savory',
  'seafood-briny'
];

/** Complementary pairs used in contrast mode (A pairs well opposite B). */
export const CONTRAST_PAIRS = [
  ['dairy-fat', 'bright-acid'],
  ['dairy-fat', 'bitter-green'],
  ['umami-deep', 'bright-acid'],
  ['umami-deep', 'citrus'],
  ['smoke', 'bright-acid'],
  ['smoke', 'green-herb'],
  ['spice-warm', 'citrus'],
  ['spice-warm', 'fermented'],
  ['chile-heat', 'dairy-fat'],
  ['chile-heat', 'citrus'],
  ['chocolate', 'citrus'],
  ['chocolate', 'stone-fruit'],
  ['nutty', 'bright-acid'],
  ['grain-toasty', 'bitter-green'],
  ['seafood-briny', 'citrus'],
  ['seafood-briny', 'green-herb'],
  ['tomato-savory', 'green-herb'],
  ['tomato-savory', 'dairy-fat']
];

/**
 * Congruence mode (Western-leaning): shared families help.
 * Contrast mode (East-Asian-leaning / bright arcs): opposing axes + complementary families help.
 */
export function pairingModeFromInput(input = {}) {
  const cuisine = String(input.cuisine || 'any');
  if (['asian_inspired', 'middle_eastern'].includes(cuisine)) return 'contrast';
  if (['mediterranean', 'american', 'nordic'].includes(cuisine)) return 'congruence';
  if (input.menuArc === 'bright_light') return 'contrast';
  if (input.menuArc === 'rich_comforting' || input.menuArc === 'celebratory') return 'congruence';
  return 'balanced';
}

function sharedFamilies(a = [], b = []) {
  const setB = new Set(b);
  return a.filter((f) => setB.has(f));
}

function hasContrastPair(a = [], b = []) {
  const setA = new Set(a);
  const setB = new Set(b);
  return CONTRAST_PAIRS.some(
    ([x, y]) => (setA.has(x) && setB.has(y)) || (setA.has(y) && setB.has(x))
  );
}

function richnessOpposition(a, b) {
  const order = { light: 0, medium: 1, heavy: 2 };
  const da = Math.abs((order[a] ?? 1) - (order[b] ?? 1));
  return da;
}

/**
 * Score a candidate dish relative to a locked/selected anchor.
 * Returns { scoreDelta, fitReasons }.
 */
export function scoreAgainstAnchor(candidate, anchor, mode = 'balanced') {
  if (!candidate || !anchor || candidate.id === anchor.id) {
    return { scoreDelta: 0, fitReasons: [] };
  }

  let scoreDelta = 0;
  const fitReasons = [];
  const shared = sharedFamilies(candidate.flavorFamilies || [], anchor.flavorFamilies || []);
  const opposeRich = richnessOpposition(candidate.richness, anchor.richness);
  const contrastHit = hasContrastPair(candidate.flavorFamilies || [], anchor.flavorFamilies || []);

  if (mode === 'congruence') {
    if (shared.length) {
      scoreDelta += 6 + Math.min(8, shared.length * 3);
      fitReasons.push(`Shares ${shared.slice(0, 2).join(' · ')} with anchor`);
    }
    if (opposeRich >= 2 && candidate.role === 'contrast') {
      scoreDelta += 4;
      fitReasons.push('Light contrast for a richer anchor');
    }
  } else if (mode === 'contrast') {
    if (contrastHit) {
      scoreDelta += 10;
      fitReasons.push('Complementary flavor opposition to anchor');
    }
    if (opposeRich >= 2) {
      scoreDelta += 6;
      fitReasons.push('Richness contrast vs anchor');
    }
    if (shared.length >= 2) {
      scoreDelta -= 4; // mild penalty for too-similar in contrast mode
    }
    if (
      candidate.texture &&
      anchor.texture &&
      candidate.texture !== anchor.texture &&
      candidate.role === 'contrast'
    ) {
      scoreDelta += 3;
      fitReasons.push('Texture contrast vs anchor');
    }
  } else {
    // balanced
    if (shared.length) {
      scoreDelta += 3 + Math.min(4, shared.length * 2);
      fitReasons.push(`Echoes ${shared[0]} from anchor`);
    }
    if (contrastHit && (candidate.role === 'contrast' || candidate.role === 'relief')) {
      scoreDelta += 6;
      fitReasons.push('Bright counterpoint to anchor');
    }
    if (opposeRich >= 2 && candidate.role === 'contrast') {
      scoreDelta += 5;
      fitReasons.push('Richness contrast vs anchor');
    }
  }

  // Role-aware soft rules
  if (candidate.role === 'relief' && candidate.richness === 'light' && anchor.richness === 'heavy') {
    scoreDelta += 4;
    fitReasons.push('Clean relief under a heavy anchor');
  }
  if (candidate.role === 'finish' && shared.length === 0 && contrastHit) {
    scoreDelta += 3;
    fitReasons.push('Finish provides a deliberate pivot');
  }

  return { scoreDelta, fitReasons: fitReasons.slice(0, 3) };
}

export const DISH_CATALOG = [
  // WELCOME
  {
    id: 'citrus-olives',
    role: 'welcome',
    name: 'Citrus-marinated olives',
    blurb: 'Bright, salty, zero-heat welcome that sets a clean tone.',
    why: 'Make-ahead, room-temp, low attention.',
    makeAhead: true,
    heat: 'none',
    richness: 'light',
    texture: 'firm',
    protein: 'none',
    equipment: [],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['citrus', 'green-herb', 'bright-acid'],
    score: 78
  },
  {
    id: 'spiced-nuts',
    role: 'welcome',
    name: 'Warm spiced mixed nuts',
    blurb: 'Toasty, lightly sweet, one-pan warm welcome.',
    why: 'Can be finished in 8 minutes or held warm.',
    makeAhead: true,
    heat: 'low',
    richness: 'medium',
    texture: 'crunchy',
    protein: 'none',
    equipment: ['oven_or_skillet'],
    dietary: ['vegetarian', 'gluten_free'],
    flavorFamilies: ['spice-warm', 'nutty', 'grain-toasty'],
    score: 74
  },
  {
    id: 'pickled-veg-board',
    role: 'welcome',
    name: 'Quick-pickled vegetable board',
    blurb: 'Sharp, colorful, self-serve opening bite.',
    why: 'Fully make-ahead; frees the host completely.',
    makeAhead: true,
    heat: 'none',
    richness: 'light',
    texture: 'crisp',
    protein: 'none',
    equipment: [],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['fermented', 'bright-acid', 'allium'],
    score: 80
  },
  {
    id: 'whipped-feta-honey',
    role: 'welcome',
    name: 'Whipped feta with hot honey',
    blurb: 'Creamy, salty-sweet dip for bread or crudités.',
    why: 'Can be prepped day-before; last heat on honey only.',
    makeAhead: true,
    heat: 'low',
    richness: 'medium',
    texture: 'creamy',
    protein: 'dairy',
    equipment: [],
    dietary: ['vegetarian', 'gluten_free'],
    flavorFamilies: ['dairy-fat', 'chile-heat', 'floral'],
    score: 76
  },
  // ANCHOR
  {
    id: 'tomato-braised-chickpeas',
    role: 'anchor',
    name: 'Tomato-braised chickpeas with greens',
    blurb: 'Hearty vegetarian centerpiece that holds well.',
    why: 'One-pot, make-ahead friendly, family-style natural.',
    makeAhead: true,
    heat: 'medium',
    richness: 'medium',
    texture: 'stewy',
    protein: 'legume',
    equipment: ['stovetop'],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['tomato-savory', 'umami-deep', 'green-herb', 'allium'],
    score: 82
  },
  {
    id: 'sheet-pan-lemon-chicken',
    role: 'anchor',
    name: 'Sheet-pan lemon-herb chicken',
    blurb: 'Reliable, low-attention roasted chicken with citrus.',
    why: 'Hands-off oven time; scales cleanly.',
    makeAhead: false,
    heat: 'medium',
    richness: 'medium',
    texture: 'roasted',
    protein: 'poultry',
    equipment: ['oven'],
    dietary: ['gluten_free'],
    flavorFamilies: ['citrus', 'green-herb', 'allium', 'smoke'],
    score: 85
  },
  {
    id: 'grilled-shrimp-skewers',
    role: 'anchor',
    name: 'Grilled shrimp skewers with herb oil',
    blurb: 'Fast, bright seafood centerpiece for patio or open house.',
    why: 'Quick cook; high impact; pairs with many sides.',
    makeAhead: false,
    heat: 'high',
    richness: 'light',
    texture: 'firm',
    protein: 'seafood',
    equipment: ['grill_or_broiler'],
    dietary: ['gluten_free'],
    flavorFamilies: ['seafood-briny', 'citrus', 'green-herb', 'allium'],
    score: 81
  },
  {
    id: 'braised-short-ribs',
    role: 'anchor',
    name: 'Wine-braised short ribs',
    blurb: 'Deep, celebratory beef that can be finished day-of.',
    why: 'True make-ahead; reheats beautifully.',
    makeAhead: true,
    heat: 'low',
    richness: 'heavy',
    texture: 'tender',
    protein: 'beef',
    equipment: ['oven_or_dutch_oven'],
    dietary: ['gluten_free'],
    flavorFamilies: ['umami-deep', 'smoke', 'allium', 'spice-warm'],
    score: 84
  },
  {
    id: 'shakshuka',
    role: 'anchor',
    name: 'Shakshuka with feta',
    blurb: 'Tomato-pepper egg bake for brunch or casual dinner.',
    why: 'One skillet; flexible protein and heat level.',
    makeAhead: false,
    heat: 'medium',
    richness: 'medium',
    texture: 'saucy',
    protein: 'egg',
    equipment: ['stovetop_oven'],
    dietary: ['vegetarian', 'gluten_free'],
    flavorFamilies: ['tomato-savory', 'chile-heat', 'dairy-fat', 'spice-warm'],
    score: 79
  },
  {
    id: 'miso-glazed-salmon',
    role: 'anchor',
    name: 'Miso-glazed salmon',
    blurb: 'Umami-rich, fast seafood that feels composed.',
    why: 'Short oven time; glaze can be prepped ahead.',
    makeAhead: false,
    heat: 'medium',
    richness: 'medium',
    texture: 'flaky',
    protein: 'seafood',
    equipment: ['oven'],
    dietary: ['gluten_free'],
    flavorFamilies: ['umami-deep', 'fermented', 'seafood-briny'],
    score: 83
  },
  {
    id: 'porchetta-style-pork',
    role: 'anchor',
    name: 'Porchetta-style roasted pork',
    blurb: 'Herb-crusted, sliceable centerpiece for gatherings.',
    why: 'Can rest; excellent for family-style.',
    makeAhead: true,
    heat: 'medium',
    richness: 'heavy',
    texture: 'roasted',
    protein: 'pork',
    equipment: ['oven'],
    dietary: ['gluten_free'],
    flavorFamilies: ['green-herb', 'allium', 'smoke', 'spice-warm'],
    score: 80
  },
  // CONTRAST
  {
    id: 'bitter-greens-salad',
    role: 'contrast',
    name: 'Bitter greens with lemon vinaigrette',
    blurb: 'Sharp, bitter counterpoint that cuts richness.',
    why: 'Dress at the last moment; zero heat.',
    makeAhead: true,
    heat: 'none',
    richness: 'light',
    texture: 'crisp',
    protein: 'none',
    equipment: [],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['bitter-green', 'bright-acid', 'citrus'],
    score: 77
  },
  {
    id: 'quick-pickles',
    role: 'contrast',
    name: 'Quick cucumber or radish pickles',
    blurb: 'Crunchy, acidic, make-ahead punch.',
    why: 'Fully offline; wakes up any rich plate.',
    makeAhead: true,
    heat: 'none',
    richness: 'light',
    texture: 'crisp',
    protein: 'none',
    equipment: [],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['fermented', 'bright-acid', 'allium'],
    score: 79
  },
  {
    id: 'charred-broccoli',
    role: 'contrast',
    name: 'Charred broccoli with chili crisp',
    blurb: 'Smoky-bitter vegetable with heat.',
    why: 'High heat, short time; strong texture contrast.',
    makeAhead: false,
    heat: 'high',
    richness: 'light',
    texture: 'charred',
    protein: 'none',
    equipment: ['oven_or_grill'],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['bitter-green', 'chile-heat', 'smoke'],
    score: 75
  },
  {
    id: 'fennel-citrus-salad',
    role: 'contrast',
    name: 'Fennel-citrus salad',
    blurb: 'Crisp, anise-bright salad for rich anchors.',
    why: 'Can be sliced ahead; dress late.',
    makeAhead: true,
    heat: 'none',
    richness: 'light',
    texture: 'crisp',
    protein: 'none',
    equipment: [],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['citrus', 'green-herb', 'bright-acid'],
    score: 78
  },
  {
    id: 'kimchi-slaw',
    role: 'contrast',
    name: 'Kimchi-cabbage slaw',
    blurb: 'Fermented heat and crunch for Asian-leaning menus.',
    why: 'Assemble day-of from make-ahead base.',
    makeAhead: true,
    heat: 'none',
    richness: 'light',
    texture: 'crisp',
    protein: 'none',
    equipment: [],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['fermented', 'chile-heat', 'bright-acid'],
    score: 76
  },
  // RELIEF
  {
    id: 'simple-green-salad',
    role: 'relief',
    name: 'Simple butter-lettuce salad',
    blurb: 'Soft, mild green that never competes.',
    why: 'Zero complexity; pure host freedom.',
    makeAhead: false,
    heat: 'none',
    richness: 'light',
    texture: 'soft',
    protein: 'none',
    equipment: [],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['green-herb', 'bright-acid'],
    score: 72
  },
  {
    id: 'herbed-rice',
    role: 'relief',
    name: 'Herbed rice or grains',
    blurb: 'Neutral, absorbent base that calms the plate.',
    why: 'Can be held; reheats cleanly.',
    makeAhead: true,
    heat: 'low',
    richness: 'medium',
    texture: 'soft',
    protein: 'none',
    equipment: ['stovetop'],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['grain-toasty', 'green-herb'],
    score: 74
  },
  {
    id: 'roasted-root-veg',
    role: 'relief',
    name: 'Roasted root vegetables',
    blurb: 'Sweet, earthy, oven-friendly side.',
    why: 'Shares oven with many anchors.',
    makeAhead: true,
    heat: 'medium',
    richness: 'medium',
    texture: 'roasted',
    protein: 'none',
    equipment: ['oven'],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['grain-toasty', 'smoke', 'allium'],
    score: 73
  },
  {
    id: 'cucumber-yogurt',
    role: 'relief',
    name: 'Cucumber-yogurt sauce',
    blurb: 'Cool, dairy-bright relief for spice or smoke.',
    why: 'Fully make-ahead; no last-minute work.',
    makeAhead: true,
    heat: 'none',
    richness: 'light',
    texture: 'creamy',
    protein: 'dairy',
    equipment: [],
    dietary: ['vegetarian', 'gluten_free'],
    flavorFamilies: ['dairy-fat', 'bright-acid', 'green-herb'],
    score: 77
  },
  {
    id: 'blistered-tomatoes',
    role: 'relief',
    name: 'Blistered cherry tomatoes',
    blurb: 'Sweet-acidic burst that needs almost no attention.',
    why: '5-minute skillet or sheet-pan.',
    makeAhead: false,
    heat: 'high',
    richness: 'light',
    texture: 'juicy',
    protein: 'none',
    equipment: ['skillet_or_oven'],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['tomato-savory', 'bright-acid'],
    score: 71
  },
  // FINISH
  {
    id: 'stone-fruit-crumble',
    role: 'finish',
    name: 'Stone-fruit crumble',
    blurb: 'Warm, make-ahead friendly fruit dessert.',
    why: 'Can be baked earlier and held.',
    makeAhead: true,
    heat: 'medium',
    richness: 'medium',
    texture: 'crumbly',
    protein: 'none',
    equipment: ['oven'],
    dietary: ['vegetarian'],
    flavorFamilies: ['stone-fruit', 'grain-toasty', 'spice-warm'],
    score: 78
  },
  {
    id: 'chocolate-olive-oil-cake',
    role: 'finish',
    name: 'Chocolate olive-oil cake',
    blurb: 'Dense, make-ahead cake that needs no frosting drama.',
    why: 'Bakes day-before; serves at room temp.',
    makeAhead: true,
    heat: 'none',
    richness: 'heavy',
    texture: 'dense',
    protein: 'none',
    equipment: ['oven'],
    dietary: ['vegetarian'],
    flavorFamilies: ['chocolate', 'nutty'],
    score: 80
  },
  {
    id: 'citrus-posset',
    role: 'finish',
    name: 'Citrus posset',
    blurb: 'Set cream dessert with sharp citrus top.',
    why: 'Fully make-ahead; elegant and low effort.',
    makeAhead: true,
    heat: 'none',
    richness: 'medium',
    texture: 'creamy',
    protein: 'dairy',
    equipment: [],
    dietary: ['vegetarian', 'gluten_free'],
    flavorFamilies: ['citrus', 'dairy-fat', 'bright-acid'],
    score: 81
  },
  {
    id: 'affogato-bar',
    role: 'finish',
    name: 'Affogato or ice-cream bar',
    blurb: 'Self-serve, temperature-contrast finish.',
    why: 'Almost zero host work at service.',
    makeAhead: true,
    heat: 'none',
    richness: 'medium',
    texture: 'cold',
    protein: 'dairy',
    equipment: [],
    dietary: ['vegetarian', 'gluten_free'],
    flavorFamilies: ['dairy-fat', 'chocolate', 'coffee-bitter'],
    score: 75
  },
  {
    id: 'honey-roasted-fruit',
    role: 'finish',
    name: 'Honey-roasted seasonal fruit',
    blurb: 'Simple, warm fruit with optional yogurt.',
    why: 'Oven can share with other dishes; flexible season.',
    makeAhead: false,
    heat: 'medium',
    richness: 'light',
    texture: 'soft',
    protein: 'none',
    equipment: ['oven'],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['stone-fruit', 'floral', 'spice-warm'],
    score: 74
  },
  // Extra diversity anchors / sides for coverage
  {
    id: 'mushroom-risotto',
    role: 'anchor',
    name: 'Mushroom risotto',
    blurb: 'Creamy, umami-forward vegetarian main.',
    why: 'Attention-heavy but can be held with stock.',
    makeAhead: false,
    heat: 'medium',
    richness: 'heavy',
    texture: 'creamy',
    protein: 'none',
    equipment: ['stovetop'],
    dietary: ['vegetarian', 'gluten_free'],
    flavorFamilies: ['umami-deep', 'dairy-fat', 'allium'],
    score: 70
  },
  {
    id: 'grilled-halloumi',
    role: 'contrast',
    name: 'Grilled halloumi with herbs',
    blurb: 'Salty, squeaky cheese that adds protein contrast.',
    why: 'Fast grill; strong texture.',
    makeAhead: false,
    heat: 'high',
    richness: 'medium',
    texture: 'firm',
    protein: 'dairy',
    equipment: ['grill_or_skillet'],
    dietary: ['vegetarian', 'gluten_free'],
    flavorFamilies: ['dairy-fat', 'green-herb', 'smoke'],
    score: 72
  },
  {
    id: 'lentil-walnut-pate',
    role: 'welcome',
    name: 'Lentil-walnut pâté',
    blurb: 'Earthy, make-ahead spread for crackers or toast.',
    why: 'Fully offline; vegan-friendly.',
    makeAhead: true,
    heat: 'none',
    richness: 'medium',
    texture: 'spreadable',
    protein: 'legume',
    equipment: [],
    dietary: ['vegetarian', 'vegan', 'gluten_free'],
    flavorFamilies: ['umami-deep', 'nutty', 'allium'],
    score: 73
  }
];

function poolForRole(role, input = {}) {
  const dietary = new Set(input.dietaryCategories || []);
  const equipment = new Set(input.equipmentConstraints || []);
  return DISH_CATALOG.filter((d) => {
    if (d.role !== role) return false;
    if (dietary.size) {
      // soft: prefer dishes that declare compatibility
      const ok = (d.dietary || []).some((tag) => dietary.has(tag)) || dietary.size === 0;
      if (!ok && dietary.has('vegan') && !(d.dietary || []).includes('vegan')) return false;
    }
    // equipment soft filter omitted for breadth; conflicts handled upstream
    return true;
  });
}

/**
 * Build a full dish plan: pick primary + alternatives per role,
 * scoring supporting roles against the chosen (or locked) anchor.
 */
export function suggestFullMenu(input = {}, options = {}) {
  const mode = pairingModeFromInput(input);
  const roles = ['welcome', 'anchor', 'contrast', 'relief', 'finish'];
  const used = new Set();
  const byRole = {};

  // Choose or honor locked anchor first
  let anchor = null;
  if (options.lockedAnchorId) {
    anchor = DISH_CATALOG.find((d) => d.id === options.lockedAnchorId) || null;
  }
  if (!anchor) {
    const anchorPool = poolForRole('anchor', input)
      .map((d) => ({ ...d, score: d.score }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    anchor = anchorPool[0] || null;
  }
  if (anchor) used.add(anchor.id);

  for (const role of roles) {
    if (role === 'anchor') {
      byRole[role] = {
        role,
        primary: anchor,
        alternatives: poolForRole('anchor', input)
          .filter((d) => d.id !== anchor?.id)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((a) => ({
            id: a.id,
            name: a.name,
            blurb: a.blurb,
            makeAhead: a.makeAhead,
            heat: a.heat,
            score: a.score,
            fitReasons: [],
            flavorFamilies: a.flavorFamilies || []
          }))
      };
      continue;
    }

    const pool = poolForRole(role, input).filter((d) => !used.has(d.id));
    const ranked = pool
      .map((d) => {
        const { scoreDelta, fitReasons } = scoreAgainstAnchor(d, anchor, mode);
        return {
          ...d,
          score: Math.round(d.score + scoreDelta),
          fitReasons: [...(d.fitReasons || []), ...fitReasons].slice(0, 4)
        };
      })
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    const primary = ranked[0] || null;
    if (primary) used.add(primary.id);
    byRole[role] = {
      role,
      primary,
      alternatives: ranked.slice(1, 4).map((a) => ({
        id: a.id,
        name: a.name,
        blurb: a.blurb,
        makeAhead: a.makeAhead,
        heat: a.heat,
        score: a.score,
        fitReasons: a.fitReasons || [],
        flavorFamilies: a.flavorFamilies || []
      }))
    };
  }

  return {
    mode,
    modeNote:
      mode === 'congruence'
        ? 'Congruence mode: dishes that echo the anchor’s flavor families score higher.'
        : mode === 'contrast'
          ? 'Contrast mode: opposing richness and complementary flavor families score higher.'
          : 'Balanced mode: mild echo plus deliberate counterpoints.',
    lockedAnchorId: options.lockedAnchorId || anchor?.id || null,
    dishPlan: roles.map((role) => byRole[role])
  };
}

/** Re-score a role’s alternatives against a newly locked anchor dish id. */
export function rescoreAgainstLockedAnchor(input, lockedAnchorId) {
  return suggestFullMenu(input, { lockedAnchorId });
}
