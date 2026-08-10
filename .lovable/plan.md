# Make the instrument yours: library editing, clearer options, richer presets

Four upgrades, all client-side (no accounts, no backend), with your edits stored in the browser and portable as a JSON config file.

## 1. Library workshop (new route: /library)

A dedicated workspace to make the fixture data match your actual kitchen and taste.

- **Dish table** — every dish in the library, filterable by course, season, diet tags and cost. Inline status: built-in, edited, custom, or hidden.
- **Dish editor** — a full form drawer for each dish: name, course, note, tags (contains / formats / shapes / season), oven and burner minutes, fridge units, counter footprint, active minutes, serves per batch, make-ahead days, hold minutes, cost per guest, method, temp band, kid-friendly, outdoor-safe, and the ingredient lines (item, per-guest quantity, unit, aisle).
- **Add / duplicate / hide / restore** — built-ins are never destroyed; overrides layer on top and can be reverted individually or in bulk.
- **Equipment profiles** — save named kitchens (ovens, burners, grill, dishwasher, fridge, counter, seats) and load one into any plan in a click. Your default profile pre-fills new sessions.
- **Import / export config** — download a single JSON file containing dish overrides, custom dishes, hidden IDs, equipment profiles and saved scenarios; re-upload to restore or move between devices. Validated on import with a clear diff summary before it applies; malformed files are rejected with the reason.
- **Reset to shipped library** with a confirmation step.

Persistence: browser local storage, applied as an override layer over the shipped library so the engine reads one merged list exactly as it does today.

## 2. Option explainers

Every input in the conditions panel gets a plain-language explainer, on hover and on tap, saying what it changes in the output — not just what it means.

- Each explainer states the mechanism: e.g. Ambition raises dish count and technique difficulty, which pushes oven and hands load; Leftovers "deliberate" scales batch counts up ~25% and raises cost per head.
- Gauges, feasibility score, balance score and each stop code get a short "what this is measuring / how to relieve it" note.
- A compact glossary panel at the bottom of the workspace covering feasibility, balance, gauges, stops, hold time, make-ahead share and the cost model's indicative nature.
- Dietary filters carry an explicit reminder that they are planning filters, not allergen guarantees.

## 3. Scenario presets

Expand from three presets to a proper library, grouped and browsable rather than a single row of chips.

- Roughly a dozen shipped scenarios across shapes and seasons: e.g. spring seated dinner for six, summer cookout for twelve, autumn brunch for ten, winter reception for twenty, plant-only aperitivo, kids-at-the-table Sunday, tiny-kitchen supper, big-batch deliberate-leftovers cook.
- Each card shows shape, style, guests, season, budget tier and a one-line "what this scenario stresses" note.
- **Save current conditions as a scenario** with your own name; your scenarios live alongside the shipped ones and travel in the config export.

## 4. Dashboard and hand-off

- **Reworked plan surface**: a top summary strip (feasibility, verdict, cost per head vs ceiling, balance, hands-on minutes, make-ahead share) followed by tabs for Menu, Load, Timeline, Service and Shopping, so a long plan stops being one endless scroll.
- **Gauges** get the relief note inline, and stops move to a prominent blocking banner with the correction path.
- **Shopping list**: grouped by aisle with check-off state and a per-line dish attribution.
- **Hand-offs**: copy to clipboard as markdown, download plan as JSON, download shopping list as CSV, and an .ics calendar file for the prep timeline (each task an event on the chosen date). Print packet stays as it is.
- **Helper assignments**: timeline tasks distribute across you plus declared helpers, so the packet can be handed to another pair of hands.

## Technical notes

- New route `src/routes/library.tsx` plus a `src/components/oos/library/` component group; navigation added to the masthead.
- New `src/lib/oos/store.ts`: zod-validated schema for the config blob, local-storage read/write, and merge logic feeding `src/lib/oos/library.ts` so `buildPlan` needs no signature change.
- Engine changes limited to accepting the merged library and exposing per-gauge relief text and helper assignment on timeline entries.
- Export/import is one versioned JSON file; version mismatch is migrated or refused with a message, never silently dropped.
- Everything stays local to the browser; no server, no accounts, no data leaves the device.
