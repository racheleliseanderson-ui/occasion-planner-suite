import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * App → website return contract. Mirrors src/lib/house/return.ts
 * without booting Vite: no PII, no off-site reading links, no invented seats.
 */

const HOUSE = "https://saltnotes.blog";
const VERSION = "1.0.0";
const PROHIBITED = new Set([
  "guestNames",
  "emailAddresses",
  "medicalHistory",
  "exactAllergySafetyConclusion",
  "paymentData",
  "currentPriceGuarantees",
]);

function inspectKeys(value, found) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (PROHIBITED.has(key)) found.push(key);
    if (child && typeof child === "object") inspectKeys(child, found);
  }
}

function validate(value) {
  const errors = [];
  const found = [];
  inspectKeys(value, found);
  if (found.length) errors.push(`Prohibited return fields found: ${[...new Set(found)].join(", ")}.`);
  if (!value || value.v !== VERSION) errors.push("Unsupported return version.");
  if (!Number.isSafeInteger(value?.guests) || value.guests <= 0) errors.push("guests must be a positive integer.");
  if (value?.seatingKnown === false && value?.seatingCount) errors.push("Unknown seating cannot carry a seat count.");
  for (const piece of value?.reading || []) {
    if (!String(piece.url || "").startsWith(`${HOUSE}/`)) errors.push("Reading list may only point at saltnotes.blog.");
  }
  return { valid: errors.length === 0, errors };
}

function toBase64Url(text) {
  return Buffer.from(text, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(s) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString("utf8");
}
function encode(payload) {
  const check = validate(payload);
  if (!check.valid) throw new Error(check.errors.join(" "));
  return `j.${toBase64Url(JSON.stringify(payload))}`;
}
function decode(token) {
  const parsed = JSON.parse(fromBase64Url(token.slice(2)));
  return validate(parsed).valid ? parsed : null;
}

const PIECES = [
  { id: "last-30", url: `${HOUSE}/build-menu-around-last-30-minutes/`, tags: ["weeknight", "sheet-pan-lemon-chicken", "anchor"] },
  { id: "family", url: `${HOUSE}/family-style-without-table-traffic-jam/`, tags: ["seated", "dinner", "anchor"] },
  { id: "dialup", url: `${HOUSE}/dial-up-martini-a-lychee-yuzu-and-chrome-glass-cocktail-hour/`, tags: ["drink", "cocktail"] },
  { id: "salmon", url: `${HOUSE}/tide-turner-salmon-with-chile-lime-yogurt-and-crispy-chickpeas/`, tags: ["miso-glazed-salmon", "fish"] },
];

function matchReading(tokens) {
  const set = new Set(tokens.map((t) => t.toLowerCase()));
  return PIECES.filter((p) => p.tags.some((tag) => set.has(tag)));
}

describe("house return contract", () => {
  it("refuses guest names and other prohibited fields", () => {
    const check = validate({
      v: VERSION,
      from: "plan",
      label: "Weeknight",
      guests: 6,
      seatingKnown: true,
      dishes: [{ id: "roast-chicken", name: "Tray-roast chicken" }],
      reading: [{ title: "Hosting", url: `${HOUSE}/hosting/`, kind: "house" }],
      signature: "sig",
      guestNames: ["Ada"],
    });
    assert.equal(check.valid, false);
    assert.match(check.errors.join(" "), /Prohibited|guestNames/);
  });

  it("refuses reading links that leave the house", () => {
    const check = validate({
      v: VERSION,
      from: "plan",
      label: "Weeknight",
      guests: 6,
      reading: [{ title: "Elsewhere", url: "https://example.com/nope", kind: "essay" }],
    });
    assert.equal(check.valid, false);
    assert.match(check.errors.join(" "), /saltnotes/);
  });

  it("round-trips a compact payload and does not invent seats", () => {
    const payload = {
      v: VERSION,
      from: "architecture",
      label: "weeknight-6",
      guests: 6,
      seatingKnown: false,
      seatingCount: null,
      dishes: [{ id: "sheet-pan-lemon-chicken", name: "Sheet-pan lemon chicken", course: "anchor" }],
      reading: [
        {
          title: "Build the Menu Around the Last 30 Minutes",
          url: `${HOUSE}/build-menu-around-last-30-minutes/`,
          kind: "hosting",
        },
      ],
      signature: "weeknight-6-sheet",
    };
    const back = decode(encode(payload));
    assert.equal(back.guests, 6);
    assert.equal(back.seatingKnown, false);
    assert.equal(back.seatingCount, null);
    assert.ok(encode(payload).startsWith("j."));
  });
});

describe("editorial atlas", () => {
  it("maps a chicken tray to last-30-minutes hosting", () => {
    const pieces = matchReading(["sheet-pan-lemon-chicken", "weeknight", "anchor"]);
    assert.ok(pieces.some((p) => p.id === "last-30"));
    assert.ok(pieces.every((p) => p.url.startsWith(HOUSE)));
  });

  it("maps a cocktail hour to The One Drink writing", () => {
    const pieces = matchReading(["drink", "cocktail"]);
    assert.ok(pieces.some((p) => p.id === "dialup"));
  });

  it("maps miso salmon to a first-party fish piece", () => {
    const pieces = matchReading(["miso-glazed-salmon"]);
    assert.equal(pieces[0].id, "salmon");
  });
});
