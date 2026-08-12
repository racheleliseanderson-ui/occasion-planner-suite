// @ts-nocheck — mechanical port of SC-MB-001 engine; preserve formulas exactly.
import { suggestFullMenu } from './catalog';

const MENU_ARCS = {
  bright_light: {
    welcome: 'crisp or sparkling welcome bite',
    anchor: 'lean roasted, grilled, or gently cooked main element',
    contrast: 'acidic, herbal, or crunchy side',
    relief: 'simple green, chilled, or citrus component',
    finish: 'fruit-forward or lightly creamy finish'
  },
  rich_comforting: {
    welcome: 'small salty or warm welcome bite',
    anchor: 'slow-cooked, baked, or deeply savory main element',
    contrast: 'sharp pickle, bitter green, or bright condiment',
    relief: 'fresh salad or restrained vegetable side',
    finish: 'warm spice, chocolate, caramel, or baked-fruit finish'
  },
  seasonal: {
    welcome: 'seasonal produce or market-led welcome bite',
    anchor: 'one seasonal centerpiece suited to the service style',
    contrast: 'texture or acidity that keeps the menu awake',
    relief: 'simple preparation that preserves freshness',
    finish: 'seasonal fruit, spice, or temperature contrast'
  },
  celebratory: {
    welcome: 'one high-impact passed or poured welcome',
    anchor: 'shareable or plated centerpiece with a clear reveal',
    contrast: 'bright, crisp, or bitter counterpoint',
    relief: 'low-attention side that protects service timing',
    finish: 'make-ahead celebratory dessert with clean service'
  },
  relaxed: {
    welcome: 'set-out snack or low-maintenance first pour',
    anchor: 'family-style or buffet-friendly main',
    contrast: 'one punchy condiment or crunchy salad',
    relief: 'room-temperature or make-ahead side',
    finish: 'self-serve or fully make-ahead dessert'
  }
};

const ATTENTION = { low: 1, moderate: 2, high: 3 };
const CAPACITY = { limited: 1, standard: 2, generous: 3 };
const GUEST_PRESSURE = { under_25: 1, '25_50': 2, over_50: 3, under_12: 1, '12_24': 1 };

function unique(values) {
  return [...new Set(values || [])];
}

function scoreBand(score) {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'workable';
  return 'fragile';
}

export function evaluateMenuBuilder(input) {
  const errors = [];
  for (const key of [
    'occasion',
    'guestBand',
    'serviceStyle',
    'eventDayTime',
    'prepCapacity',
    'kitchenCapacity',
    'attentionBand',
    'menuArc'
  ]) {
    if (!input[key]) errors.push(`${key} is required`);
  }
  if (!MENU_ARCS[input.menuArc]) errors.push('unsupported menuArc');
  if (errors.length) return { status: 'invalid', errors };

  const dietary = unique(input.dietaryCategories);
  const allergens = unique(input.declaredAllergens);
  const equipment = unique(input.equipmentConstraints);
  const arc = MENU_ARCS[input.menuArc];
  const attention = ATTENTION[input.attentionBand] || 2;
  const kitchen = CAPACITY[input.kitchenCapacity] || 2;
  const prep = CAPACITY[input.prepCapacity] || 2;
  const eventTime = ATTENTION[input.eventDayTime] || 2;
  const guestPressure = GUEST_PRESSURE[input.guestBand] || 1;

  const complexityPressure =
    attention + guestPressure + Math.max(0, 3 - kitchen) + Math.max(0, 3 - prep) + Math.max(0, 3 - eventTime);
  const conflicts = [];
  if (attention >= 3 && prep <= 1)
    conflicts.push('The menu asks for high-touch cooking without enough advance-prep capacity.');
  if (attention >= 3 && kitchen <= 1)
    conflicts.push('The active cooking load exceeds the declared kitchen capacity.');
  if (guestPressure >= 3 && input.serviceStyle === 'plated' && input.attentionBand !== 'high')
    conflicts.push(
      'Plated service at this guest count needs more service labor or fewer individually finished elements.'
    );
  if (equipment.includes('limited_oven') && ['celebratory', 'rich_comforting'].includes(input.menuArc))
    conflicts.push('The menu arc is likely to compete for oven space during the final service window.');
  if (equipment.includes('limited_refrigeration') && prep >= 2)
    conflicts.push('Advance preparation is useful, but cold holding capacity may become the bottleneck.');
  if (equipment.includes('limited_burners') && attention >= 2)
    conflicts.push('Too many last-minute stovetop jobs could collide during service.');

  const dimensions = {
    balance: Math.max(
      45,
      100 - (input.menuArc === 'rich_comforting' ? 8 : 0) - (dietary.length > 2 ? 6 : 0)
    ),
    makeAhead: Math.max(
      35,
      100 - attention * 12 + prep * 8 - (equipment.includes('limited_refrigeration') ? 18 : 0)
    ),
    serviceFit: Math.max(
      30,
      100 - guestPressure * 8 - (input.serviceStyle === 'plated' ? 14 : 0) + kitchen * 7
    ),
    equipmentFit: Math.max(
      25,
      100 - conflicts.filter((item) => /oven|kitchen|stovetop|holding/i.test(item)).length * 18
    ),
    hostFreedom: Math.max(25, 100 - attention * 16 - guestPressure * 7 + prep * 8)
  };

  const weakDimensions = Object.entries(dimensions)
    .filter(([, score]) => score < 65)
    .sort((a, b) => a[1] - b[1])
    .map(([dimension, score]) => ({ dimension, score, band: scoreBand(score) }));

  const simplifications = [];
  if (complexityPressure >= 9)
    simplifications.push(
      'Keep one anchor and no more than two supporting preparations that need active finishing.'
    );
  if (conflicts.length)
    simplifications.push('Move dessert and at least one side entirely out of the final service window.');
  if (input.serviceStyle === 'plated' && guestPressure >= 2)
    simplifications.push(
      'Convert one plated course to a pre-set, family-style, or self-serve element.'
    );
  if (dimensions.hostFreedom < 65)
    simplifications.push(
      'Choose one component that can be served at room temperature and one that can hold without quality loss.'
    );
  if (!simplifications.length)
    simplifications.push(
      'Protect the plan with one flexible make-ahead component and a deliberately simple finish.'
    );

  // CHANGE 0.5.0 (additive): budget pressure previously collected but unused.
  // Does not alter scores — only surfaces deterministic simplification guidance.
  if (input.budgetPressure) {
    simplifications.push(
      'Under budget pressure: prefer pantry-stable sides, one market-ready finish, and fewer specialty ingredients.'
    );
  }

  const recoveryPlan = [];
  if (equipment.includes('limited_oven'))
    recoveryPlan.push(
      'If the oven falls behind, hold the anchor and serve the contrast or relief course first.'
    );
  if (equipment.includes('limited_refrigeration'))
    recoveryPlan.push(
      'Stage only food that requires cold holding; move shelf-stable garnishes, beverages, and service pieces elsewhere.'
    );
  if (input.serviceStyle === 'plated')
    recoveryPlan.push(
      'If plating slips, switch the anchor to family-style service before food quality declines.'
    );
  if (!recoveryPlan.length)
    recoveryPlan.push(
      'If timing slips, delay the anchor rather than adding last-minute heat to every component.'
    );

  const dietaryNotes = dietary.map(
    (item) =>
      `Build a clearly labeled ${item} route that preserves the same welcome, anchor, contrast, relief, and finish jobs.`
  );
  const safetyBoundaries = [
    'Use current food-safety guidance for time, temperature, cooling, reheating, and service.',
    'The planner does not guarantee allergen safety or evaluate cross-contact.'
  ];
  if (allergens.length)
    safetyBoundaries.push(
      `Declared allergen categories (${allergens.join(
        ', '
      )}) require controlled recipes, ingredient verification, and cross-contact review.`
    );

  const beverageDirection =
    input.beverageRoute === 'alcoholic'
      ? 'Pair the primary drink to the anchor, then provide a zero-proof counterpart with equal acidity, aroma, bitterness, dilution, and visual intention.'
      : input.beverageRoute === 'zero_proof'
        ? 'Treat the zero-proof pairing as the primary drink: build it around acidity, bitterness, aroma, dilution, and temperature rather than sweetness alone.'
        : 'Offer one primary pairing and one intentional zero-proof counterpart; neither should read as the consolation option.';

  const diagnosticScore = Math.round(
    Object.values(dimensions).reduce((sum, score) => sum + score, 0) / Object.keys(dimensions).length
  );
  const confidenceScore = Math.max(
    35,
    diagnosticScore - conflicts.length * 6 - (!input.equipmentConstraints ? 5 : 0)
  );

  // Dish suggestions + flavor-family scoring vs anchor
  const suggestion = suggestFullMenu(input, {
    lockedAnchorId: input.lockedAnchorId || null
  });

  return {
    status: conflicts.length ? 'menu_with_constraints' : 'menu_structure',
    applicationId: 'SC-MB-001',
    thesis: `${input.occasion}: a ${input.menuArc.replaceAll('_', ' ')} menu built for ${input.serviceStyle} service and the host’s actual capacity.`,
    roles: {
      welcome: suggestion.dishPlan.find((d) => d.role === 'welcome')?.primary?.name || arc.welcome,
      anchor: suggestion.dishPlan.find((d) => d.role === 'anchor')?.primary?.name || arc.anchor,
      contrast: suggestion.dishPlan.find((d) => d.role === 'contrast')?.primary?.name || arc.contrast,
      relief: suggestion.dishPlan.find((d) => d.role === 'relief')?.primary?.name || arc.relief,
      finish: suggestion.dishPlan.find((d) => d.role === 'finish')?.primary?.name || arc.finish
    },
    serviceLogic: input.serviceStyle,
    menuStressTest: {
      score: diagnosticScore,
      band: scoreBand(diagnosticScore),
      dimensions,
      weakDimensions,
      verdict: weakDimensions.length
        ? `The menu can work, but ${weakDimensions
            .map((item) => item.dimension)
            .join(' and ')} need correction before recipes are locked.`
        : 'The menu structure is operationally balanced enough to proceed to recipe selection and sequencing.'
    },
    dietaryNotes,
    attentionAndEquipmentConflicts: conflicts,
    prepTimeline: {
      early: 'Complete shelf-stable purchases, bases, sauces, and make-ahead dessert components.',
      dayBefore: 'Finish cold components, labels, serving equipment, and the reheating and holding plan.',
      eventDay: 'Reserve active cooking for the anchor and one time-sensitive contrast only.',
      service: 'Sequence welcome, anchor, relief, and finish so the host is not trapped in the kitchen.'
    },
    beverageDirection,
    safetyBoundaries,
    simplifyFirst: simplifications,
    recoveryPlan,
    nextActions: [
      'Lock one preparation method for each suggested dish (or swap to an alternative).',
      'Mark every component as make-ahead, holdable, or last-minute.',
      'Resolve the lowest-scoring stress-test dimension before adding another dish.',
      'Send the bounded plan to Occasion OS for sequencing and execution review.'
    ],
    confidence: {
      score: confidenceScore,
      band: scoreBand(confidenceScore),
      explanation:
        'Confidence reflects operational completeness, not recipe testing, nutrition analysis, or allergen safety.'
    },
    pairingMode: suggestion.mode,
    pairingModeNote: suggestion.modeNote,
    lockedAnchorId: suggestion.lockedAnchorId,
    dishPlan: suggestion.dishPlan.map((block) => ({
      role: block.role,
      primary: block.primary
        ? {
            id: block.primary.id,
            name: block.primary.name,
            blurb: block.primary.blurb,
            why: block.primary.why,
            makeAhead: block.primary.makeAhead,
            heat: block.primary.heat,
            richness: block.primary.richness,
            texture: block.primary.texture,
            flavorFamilies: block.primary.flavorFamilies || [],
            score: block.primary.score,
            fitReasons: block.primary.fitReasons || []
          }
        : null,
      alternatives: (block.alternatives || []).map((a) => ({
        id: a.id,
        name: a.name,
        blurb: a.blurb,
        makeAhead: a.makeAhead,
        heat: a.heat,
        score: a.score,
        fitReasons: a.fitReasons || [],
        flavorFamilies: a.flavorFamilies || []
      }))
    }))
  };
}

export { suggestFullMenu, rescoreAgainstLockedAnchor, pairingModeFromInput } from './catalog';
