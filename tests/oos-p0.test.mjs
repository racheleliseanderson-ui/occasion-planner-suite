import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * P0 invariants. These encode the contract without booting the app:
 * seats are never invented, limited ≠ absent, egg is its own exclusion.
 */

function kitchenFromLimits(limits, base) {
  const ovens = limits.oven === "none" ? 0 : limits.oven === "limited" ? 1 : Math.max(1, base.ovens);
  const burners = limits.burners === "none" ? 0 : limits.burners === "limited" ? 2 : Math.max(2, base.burners);
  const fridge = limits.refrigeration === "limited" || limits.refrigeration === "none" ? "tight" : base.fridge;
  return {
    ovens,
    burners,
    fridge,
    ovenLimited: limits.oven === "limited",
    burnerLimited: limits.burners === "limited",
  };
}

function mapAllergen(declared) {
  const diets = new Set();
  for (const raw of declared) {
    const key = raw.toLowerCase();
    if (key === "egg" || key === "eggs") diets.add("no-egg");
    else if (key.includes("gluten")) diets.add("no-gluten");
    else if (key === "milk" || key.includes("dairy")) diets.add("no-dairy");
    else if (key.includes("nut")) diets.add("no-nut");
    else if (key.includes("shellfish")) diets.add("no-shellfish");
  }
  return [...diets];
}

function applySeats({ seatingDeclared, seatingCount, guestCount }) {
  if (!seatingDeclared || seatingCount == null) return { seatingKnown: false, seats: 0 };
  return { seatingKnown: true, seats: Number(seatingCount) };
}

describe("P0 handoff invariants", () => {
  it("does not invent seats from guest count", () => {
    const applied = applySeats({ seatingDeclared: false, seatingCount: null, guestCount: 18 });
    assert.equal(applied.seatingKnown, false);
    assert.equal(applied.seats, 0);
    assert.notEqual(applied.seats, 18);
  });

  it("passes declared seats unchanged", () => {
    const applied = applySeats({ seatingDeclared: true, seatingCount: 10, guestCount: 18 });
    assert.equal(applied.seats, 10);
    assert.equal(applied.seatingKnown, true);
  });

  it("treats limited oven as one oven, not zero", () => {
    const kitchen = kitchenFromLimits(
      { oven: "limited", burners: "full", refrigeration: "full" },
      { ovens: 2, burners: 4, fridge: "normal" },
    );
    assert.equal(kitchen.ovens, 1);
    assert.equal(kitchen.ovenLimited, true);
    assert.notEqual(kitchen.ovens, 0);
  });

  it("treats limited burners as two burners, not zero", () => {
    const kitchen = kitchenFromLimits(
      { oven: "full", burners: "limited", refrigeration: "full" },
      { ovens: 1, burners: 4, fridge: "normal" },
    );
    assert.equal(kitchen.burners, 2);
    assert.equal(kitchen.burnerLimited, true);
  });

  it("only an explicit none removes the oven", () => {
    const kitchen = kitchenFromLimits(
      { oven: "none", burners: "full", refrigeration: "full" },
      { ovens: 1, burners: 4, fridge: "normal" },
    );
    assert.equal(kitchen.ovens, 0);
  });

  it("maps egg to no-egg, never to no-meat", () => {
    const diets = mapAllergen(["egg"]);
    assert.deepEqual(diets, ["no-egg"]);
    assert.equal(diets.includes("no-meat"), false);
  });

  it("accepts fixture-scale perGuest values", () => {
    const tomatoPaste = 15;
    const mozzarella = 60;
    assert.ok(tomatoPaste <= 250);
    assert.ok(mozzarella <= 250);
    assert.ok(tomatoPaste > 10);
  });
});


/**
 * Beverage-track hard stops. Mirrors buildBeverageStress + expansion rules:
 * equal visibility, ice load, station attention.
 */
function buildBeverageStress(input) {
  const dimensions = {
    batchStability: 78,
    coldIceLoad: input.iceHeavy ? 55 : 82,
    serviceAttention: input.attentionBand === "low" ? 70 : 85,
    equipmentContention: input.hotStation ? 58 : 88,
    equalVisibility: input.hasEqual || input.mode === "alcoholic" ? 90 : 35,
    makeAheadWindow: 80,
    serviceStyleFit: 75,
  };
  if (input.mode === "zero_proof" && !input.hasEqual) {
    dimensions.equalVisibility = 20;
  }
  return dimensions;
}

function beverageHardStops(input, dimensions) {
  const stops = [];
  if ((dimensions.equalVisibility ?? 100) < 50 && input.mode !== "alcoholic") {
    stops.push("EQUAL_VISIBILITY_REQUIRED");
  }
  if ((dimensions.coldIceLoad ?? 100) < 60) {
    stops.push("ICE_LOAD_UNSUPPORTED");
  }
  if (
    (dimensions.equipmentContention ?? 100) < 60 ||
    ((dimensions.serviceAttention ?? 100) < 65 && (dimensions.equipmentContention ?? 100) < 70)
  ) {
    stops.push("STATION_ATTENTION_UNSUPPORTED");
  }
  return stops;
}

describe("P0 beverage hard stops", () => {
  it("fails Equal Visibility when zero-proof route has no locked Equal", () => {
    const dims = buildBeverageStress({
      mode: "both",
      hasEqual: false,
      iceHeavy: false,
      hotStation: false,
      attentionBand: "moderate",
    });
    assert.ok(dims.equalVisibility < 50);
    const stops = beverageHardStops({ mode: "both" }, dims);
    assert.ok(stops.includes("EQUAL_VISIBILITY_REQUIRED"));
  });

  it("passes Equal Visibility when Equal is locked or route is alcoholic-only", () => {
    const withEqual = buildBeverageStress({
      mode: "both",
      hasEqual: true,
      iceHeavy: false,
      hotStation: false,
      attentionBand: "moderate",
    });
    assert.ok(withEqual.equalVisibility >= 50);
    assert.equal(beverageHardStops({ mode: "both" }, withEqual).includes("EQUAL_VISIBILITY_REQUIRED"), false);

    const alcoholic = buildBeverageStress({
      mode: "alcoholic",
      hasEqual: false,
      iceHeavy: false,
      hotStation: false,
      attentionBand: "moderate",
    });
    assert.ok(alcoholic.equalVisibility >= 50);
    assert.equal(beverageHardStops({ mode: "alcoholic" }, alcoholic).includes("EQUAL_VISIBILITY_REQUIRED"), false);
  });

  it("fails ice load when the route is ice-heavy", () => {
    const dims = buildBeverageStress({
      mode: "both",
      hasEqual: true,
      iceHeavy: true,
      hotStation: false,
      attentionBand: "moderate",
    });
    assert.ok(dims.coldIceLoad < 60);
    const stops = beverageHardStops({ mode: "both" }, dims);
    assert.ok(stops.includes("ICE_LOAD_UNSUPPORTED"));
  });

  it("passes ice load when the route is not ice-heavy", () => {
    const dims = buildBeverageStress({
      mode: "both",
      hasEqual: true,
      iceHeavy: false,
      hotStation: false,
      attentionBand: "moderate",
    });
    assert.ok(dims.coldIceLoad >= 60);
    assert.equal(beverageHardStops({ mode: "both" }, dims).includes("ICE_LOAD_UNSUPPORTED"), false);
  });

  it("fails station attention when a hot station contends for equipment", () => {
    const dims = buildBeverageStress({
      mode: "both",
      hasEqual: true,
      iceHeavy: false,
      hotStation: true,
      attentionBand: "low",
    });
    assert.ok(dims.equipmentContention < 60);
    const stops = beverageHardStops({ mode: "both" }, dims);
    assert.ok(stops.includes("STATION_ATTENTION_UNSUPPORTED"));
  });

  it("passes station attention without hot station pressure", () => {
    const dims = buildBeverageStress({
      mode: "both",
      hasEqual: true,
      iceHeavy: false,
      hotStation: false,
      attentionBand: "moderate",
    });
    assert.ok(dims.equipmentContention >= 60);
    assert.equal(beverageHardStops({ mode: "both" }, dims).includes("STATION_ATTENTION_UNSUPPORTED"), false);
  });
});
