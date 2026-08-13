// @ts-nocheck — mechanical port of handoff contract 1.1.0; do not weaken validation.
export const MENU_OCCASION_HANDOFF_MESSAGE = 'salty:menu-occasion-handoff';
export const MENU_OCCASION_HANDOFF_STATUS_MESSAGE = 'salty:menu-occasion-handoff-status';
export const MENU_OCCASION_HANDOFF_VERSION = '1.1.0';

const REQUIRED_FIELDS = [
  'applicationId',
  'contractVersion',
  'occasionType',
  'guestCount',
  'serviceStyle',
  'menuThesis',
  'menuRoles',
  'equipmentConstraints',
  'hostAttention',
  'dietaryCategories',
  'allergenBoundary',
  'beverageDirection',
  'zeroProofDirection',
  'simplifications',
  'unknowns',
  'conflicts',
  'hardStops',
  'explanation',
  'nextActions'
];

const PROHIBITED_FIELDS = new Set([
  'guestNames',
  'emailAddresses',
  'medicalHistory',
  'exactAllergySafetyConclusion',
  'paymentData',
  'currentPriceGuarantees'
]);

const SERVICE_STYLE_MAP = Object.freeze({
  family_style: 'seated',
  plated: 'seated',
  buffet: 'buffet',
  grazing: 'grazing'
});

const EQUIPMENT_CONSTRAINT_MAP = Object.freeze({
  limited_oven: 'oven',
  limited_burners: 'stovetop',
  limited_refrigeration: 'refrigerator'
});

const ALLERGEN_MAP = Object.freeze({
  gluten: 'gluten',
  egg: 'egg',
  milk: 'milk',
  'tree nut': 'tree-nut',
  'tree-nut': 'tree-nut'
});

export function guestBandFromCount(value) {
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count <= 0) return null;
  if (count < 12) return 'under_12';
  if (count <= 24) return '12_24';
  if (count <= 50) return '25_50';
  return 'over_50';
}

export function buildMenuOccasionHandoff(input, output) {
  const guestCount = Number(input?.guestCount);
  const serviceStyle = SERVICE_STYLE_MAP[input?.serviceStyle] || null;
  const errors = [];

  if (!output || !['menu_structure', 'menu_with_constraints'].includes(output.status)) {
    errors.push('A valid Menu Builder result is required.');
  }
  if (!Number.isSafeInteger(guestCount) || guestCount <= 0) {
    errors.push('guestCount must be a positive integer.');
  }
  if (!serviceStyle) errors.push('A supported service style is required.');
  if (output?.expansion?.hardStops?.length) errors.push('Hard stops must be resolved before Occasion OS transfer.');
  if (errors.length) return { status: 'invalid', errors };

  const beverageMode = String(input.beverageRoute || 'both');
  const zeroProofDirection = beverageMode === 'zero_proof'
    ? 'Zero-proof is the primary pairing route and must retain full flavor, visual, and service intention.'
    : beverageMode === 'alcoholic'
      ? 'An equal-status zero-proof counterpart is required alongside the alcoholic route.'
      : 'The primary pairing and an equal-status zero-proof counterpart are both required.';

  const expansion = output.expansion || {};
  const handoff = {
    applicationId: 'SC-MB-001',
    contractVersion: MENU_OCCASION_HANDOFF_VERSION,
    occasionType: String(input.occasion),
    guestCount,
    serviceStyle,
    menuThesis: String(output.thesis),
    menuRoles: { ...output.roles },
    equipmentConstraints: [...new Set(input.equipmentConstraints || [])],
    hostAttention: String(input.attentionBand),
    dietaryCategories: [...new Set(input.dietaryCategories || [])],
    allergenBoundary: {
      declaredCategories: [...new Set(input.declaredAllergens || [])],
      statement: 'Declared categories require controlled recipes, ingredient verification, and cross-contact review. This handoff does not establish allergy safety.'
    },
    beverageDirection: String(output.beverageDirection),
    zeroProofDirection,
    simplifications: [...output.simplifyFirst],
    unknowns: [...(expansion.unknowns || [
      'exact recipes and ingredient identities',
      'supplier and label verification',
      'cross-contact controls',
      'live holding and service conditions'
    ])],
    conflicts: [...(expansion.conflicts || [])],
    hardStops: [...(expansion.hardStops || [])],
    explanation: [...(expansion.explanation || [])],
    nextActions: [...(expansion.nextActions || [])],
    beverageMode
  };

  const validation = validateMenuOccasionHandoff(handoff);
  return validation.valid ? { status: 'ready', handoff } : { status: 'invalid', errors: validation.errors };
}

export function validateMenuOccasionHandoff(value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, errors: ['Handoff must be an object.'] };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in value)) errors.push(`Missing required handoff field: ${field}.`);
  }
  if (value.applicationId !== 'SC-MB-001') errors.push('This architecture packet is not from this instrument.');
  if (value.contractVersion !== MENU_OCCASION_HANDOFF_VERSION) errors.push('This architecture packet is from an unsupported version.');
  if (!Number.isSafeInteger(value.guestCount) || value.guestCount <= 0) errors.push('guestCount must be a positive integer.');
  if (!['seated', 'buffet', 'grazing'].includes(value.serviceStyle)) errors.push('serviceStyle is unsupported.');
  if (!value.menuRoles || typeof value.menuRoles !== 'object' || Array.isArray(value.menuRoles)) errors.push('menuRoles must be an object.');
  for (const field of ['equipmentConstraints', 'dietaryCategories', 'simplifications', 'unknowns', 'conflicts', 'hardStops', 'explanation', 'nextActions']) {
    if (!Array.isArray(value[field])) errors.push(`${field} must be an array.`);
  }
  if (!value.allergenBoundary || typeof value.allergenBoundary !== 'object' || !Array.isArray(value.allergenBoundary.declaredCategories)) {
    errors.push('allergenBoundary must include declaredCategories.');
  }
  if (value.hardStops?.length) errors.push('Handoff cannot contain unresolved hardStops.');

  const foundProhibited = [];
  inspectKeys(value, foundProhibited);
  if (foundProhibited.length) errors.push(`Prohibited handoff fields found: ${[...new Set(foundProhibited)].join(', ')}.`);

  return { valid: errors.length === 0, errors };
}

export function mapMenuOccasionHandoffToOccasionInput(handoff) {
  const validation = validateMenuOccasionHandoff(handoff);
  if (!validation.valid) return { status: 'invalid', errors: validation.errors };

  const constrainedEquipment = new Set(
    handoff.equipmentConstraints.map((constraint) => EQUIPMENT_CONSTRAINT_MAP[constraint]).filter(Boolean)
  );
  const availableEquipment = ['oven', 'stovetop', 'refrigerator'].filter((item) => !constrainedEquipment.has(item));

  const declared = handoff.allergenBoundary.declaredCategories;
  const excludedAllergens = declared.map((item) => ALLERGEN_MAP[item]).filter(Boolean);
  const unsupportedAllergens = declared.filter((item) => !ALLERGEN_MAP[item]);

  if (unsupportedAllergens.length) {
    return {
      status: 'blocked',
      code: 'HANDOFF_ALLERGEN_CATEGORY_UNSUPPORTED',
      message: `The controlled Occasion OS fixture does not contain a reviewed mapping for: ${unsupportedAllergens.join(', ')}.`,
      correction: 'Reset the handoff or add a reviewed fixture substitution before producing an execution plan.',
      unsupportedAllergens
    };
  }

  return {
    status: 'mapped',
    input: {
      occasionType: handoff.occasionType,
      guestCount: handoff.guestCount,
      serviceStyle: handoff.serviceStyle,
      excludedAllergens,
      availableEquipment,
      includeCocktailRoute: handoff.beverageMode !== 'zero_proof'
    },
    context: {
      applicationId: handoff.applicationId,
      contractVersion: handoff.contractVersion,
      menuThesis: handoff.menuThesis,
      dietaryCategories: handoff.dietaryCategories,
      equipmentConstraints: handoff.equipmentConstraints,
      simplifications: handoff.simplifications,
      unknowns: handoff.unknowns,
      conflicts: handoff.conflicts,
      explanation: handoff.explanation,
      nextActions: handoff.nextActions
    }
  };
}

function inspectKeys(value, found) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (PROHIBITED_FIELDS.has(key)) found.push(key);
    if (child && typeof child === 'object') inspectKeys(child, found);
  }
}
