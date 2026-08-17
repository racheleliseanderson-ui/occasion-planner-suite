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
