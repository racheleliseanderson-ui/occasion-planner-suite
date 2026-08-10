# Light / Dark Toggle + Deeper Planning Intelligence

Two upgrades to the Occasion Operating System: a proper ink/parchment theme switch, and a much deeper data and options layer behind the planner.

## 1. Theme: parchment (light) and ink (dark)

- A small toggle in the top rail, next to the brand mark. Sun/moon-free: two hairline glyphs in the existing brass/mono language, not a generic switch.
- First visit follows the operating system preference. Once toggled, the choice is remembered on that device and wins over the system.
- No flash of the wrong theme on load: theme is applied before first paint.
- Dark mode is a real second art direction, not an inverted light one: deep ink field, warm paper-white type, brass raised in weight, imagery given a slightly darker grade. Signal colours (clear / controlled / tight / over) get their own dark values so gauges stay legible.
- The printable Host Packet always prints on white regardless of the on-screen theme.

## 2. Bigger dish library

Expand from ~20 to 60+ dishes so menus stop repeating across occasions:
- Broader coverage per shape (dinner, brunch, reception, cookout, aperitivo) and per service style, so grazing and cocktail stop borrowing seated-dinner logic.
- Seasonal tagging (spring / summer / autumn / winter / year-round).
- More non-alcoholic and batched-drink entries, more vegetable anchors, more genuinely make-ahead items.
- Every dish keeps full resource metadata (oven, burner, cold, counter, hands-on, hold time) and a per-guest ingredient line so the shopping list and gauges stay honest.

## 3. Richer inputs

New conditions on the panel, grouped so it does not become a form wall:
- Season (drives dish availability and a seasonal note).
- Budget tier (per-head ceiling; the engine trims ambition rather than silently overspending).
- Dietary counts instead of blanket flags — e.g. 3 of 12 vegan, 2 gluten-free — so the engine can plan a parallel dish rather than converting the whole menu.
- Kids present, outdoor space available, and a leftovers goal (none / some / deliberate).
- Existing constraints (guests, helpers, service time, prep window, ambition, kitchen) stay as they are.

Dietary tags remain planning filters, not allergy guarantees — that caution stays visible.

## 4. Smarter engine output

- Menu balance scoring: penalise repeated cooking methods, repeated dominant ingredients, too many day-of dishes, and courses that all land in the same temperature band. The chosen route has to earn its place.
- Cost estimate per head and a total, with a warning when the budget tier is exceeded.
- Swap-a-dish: any dish in the route can be replaced from ranked alternates that fit the same slot, diets and remaining capacity. Gauges, timeline and shopping list recompute immediately.
- Stronger corrections on hard stops: each stop proposes a specific, applicable fix (drop a dish, shift a dish to D-1, borrow an oven, move service later) rather than generic advice.
- Coverage line for dietary counts: shows which guests are served by which dish.

## 5. Editable data

- The host can edit a dish's name, note, servings-per-batch and ingredient quantities, and add their own dish with resource metadata.
- Pantry staples list: mark what is already owned so it drops off the shopping list.
- Edits are stored in the browser for that device, layered over the built-in library, with a clear reset-to-defaults control. No account or backend needed.

## Technical notes

- Theme: `dark` class on `<html>`, driven by a small pre-hydration inline script plus a `useTheme` hook; a full dark token set added under `.dark` in `src/styles.css`. All components keep using semantic tokens only.
- Data: `src/lib/oos/dishes.ts` expanded; `Dish` gains `season`, `costPerGuest`, `method`, `tempBand`. `Conditions` gains `season`, `budgetTier`, `dietCounts`, `kids`, `outdoor`, `leftovers`.
- Engine: selection refactored into candidate scoring (fit, balance, cost, capacity) with the existing fail-closed stop checks intact; new `swapCandidates(plan, slot)` helper for the swap control.
- Overrides: `src/lib/oos/library.ts` merges localStorage overrides with the built-in library; the engine reads only the merged view, so variants and the packet stay consistent.
- Print path unchanged; packet gains cost and dietary-coverage lines.
