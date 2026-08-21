// @ts-nocheck — mechanical port of SC-MB-001 engine; preserve formulas exactly.
export function buildMenuBuilderExpansion(input, output) {
  const unknowns = [];
  if (!input.dietaryCategories?.length) unknowns.push('No dietary route was declared; verify whether any guest needs a separate route.');
  if (!input.declaredAllergens?.length) unknowns.push('No allergen category was declared; this does not establish that none exists.');
  if (!input.equipmentConstraints?.length) unknowns.push('No equipment constraint was declared; confirm oven, burner, refrigeration, holding, and serving capacity.');
  if (!input.beverageRoute) unknowns.push('No beverage route was declared; choose the primary pairing and equal-status zero-proof route.');

  const conflicts = (output.attentionAndEquipmentConflicts || []).map((message, index) => ({
    code: `MENU_CONFLICT_${String(index + 1).padStart(2, '0')}`,
    message,
    whyItMatters: 'This conflict can turn a coherent menu into a service bottleneck or force last-minute substitution.',
    nextAction: output.simplifyFirst?.[index] || output.simplifyFirst?.[0] || 'Reduce one active component before adding anything else.'
  }));

  const hardStops = [];
  if ((input.declaredAllergens || []).length) {
    hardStops.push({
      code: 'ALLERGEN_SAFETY_NOT_ESTABLISHED',
      message: 'The planner cannot establish allergen safety or cross-contact control.',
      nextAction: 'Use controlled recipes, verify every ingredient label, document substitutions, and confirm the service environment before serving.'
    });
  }
  if (input.guestBand === 'over_50' && input.serviceStyle === 'plated' && input.attentionBand !== 'high') {
    hardStops.push({
      code: 'PLATED_SERVICE_CAPACITY_UNSUPPORTED',
      message: 'The declared service capacity does not support a confident plated-service recommendation for this guest band.',
      nextAction: 'Add trained service help or change one course to family-style, buffet, or pre-set service.'
    });
  }

  // Beverage-track hard stops (equal visibility, ice load, station attention)
  const bevDims = output.beverageStressTest?.dimensions || output.beverageRouteResult?.stress?.dimensions || {};
  const bevMode = String(input.beverageRoute || output.beverageRouteResult?.mode || '');
  if ((bevDims.equalVisibility ?? 100) < 50 && bevMode !== 'alcoholic') {
    hardStops.push({
      code: 'EQUAL_VISIBILITY_REQUIRED',
      message: 'Equal-status zero-proof is missing or invisible on the beverage route.',
      nextAction: 'Lock an Equal role drink with the same glassware and station presence, or declare alcoholic-only.'
    });
  }
  if ((bevDims.coldIceLoad ?? 100) < 60) {
    hardStops.push({
      code: 'ICE_LOAD_UNSUPPORTED',
      message: 'Declared ice / cold load exceeds a comfortable service plan for this route.',
      nextAction: 'Reduce frozen or high-ice drinks, buy a dedicated ice budget, or move one cold hold off the main fridge/ice path.'
    });
  }
  if ((bevDims.equipmentContention ?? 100) < 60 || ((bevDims.serviceAttention ?? 100) < 65 && (bevDims.equipmentContention ?? 100) < 70)) {
    hardStops.push({
      code: 'STATION_ATTENTION_UNSUPPORTED',
      message: 'Station heat, blender, or build-your-own attention collides with host capacity.',
      nextAction: 'Simplify the station (urn or dispenser only), pre-batch, or add a dedicated station helper.'
    });
  }

  const explanation = [
    `The menu thesis uses the ${String(input.menuArc || '').replaceAll('_', ' ')} arc and ${String(input.serviceStyle || '').replaceAll('_', ' ')} service style.`,
    `Operational pressure reflects guest band, host attention, preparation capacity, kitchen capacity, and event-day time.`,
    conflicts.length ? `${conflicts.length} conflict${conflicts.length === 1 ? '' : 's'} reduced confidence and generated simplification steps.` : 'No declared operational conflict reduced confidence.',
    unknowns.length ? `${unknowns.length} unknown${unknowns.length === 1 ? '' : 's'} remain visible rather than being treated as safe assumptions.` : 'The declared planning inputs were operationally complete for this bounded result.'
  ];

  const nextActions = [
    ...(output.simplifyFirst || []).map((action, index) => ({ priority: index + 1, action, owner: 'host' })),
    { priority: (output.simplifyFirst || []).length + 1, action: 'Verify recipes, ingredient labels, holding conditions, and serving equipment outside this planner.', owner: 'host' },
    { priority: (output.simplifyFirst || []).length + 2, action: 'Continue to Occasion OS only after the bounded handoff is available and the remaining unknowns are acceptable.', owner: 'host' }
  ];

  return {
    schemaVersion: '1.0.0',
    unknowns,
    conflicts,
    hardStops,
    explanation,
    nextActions,
    canContinue: hardStops.length === 0
  };
}
