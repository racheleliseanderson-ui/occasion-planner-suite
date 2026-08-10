# Occasion OS — depth, accessibility and hand-off release

A single build that grows the data, opens up the conditions, makes the whole instrument usable on a phone and by more eyes, and adds a proper menu-builder hand-off. Everything stays local to the browser: no accounts, no server, no data leaves the device.

## 1. Dish library to 200+

- Grow the shipped library from the current 53 dishes to 200+, written as real cooking with full resource metadata: oven and burner minutes, fridge units, counter footprint, active minutes, serves per batch, make-ahead days, hold time, cost per head, method, temperature band, season, kid and outdoor suitability, and ingredient lines with aisles.
- Coverage is deliberate, not padding: every course, every service style, every season, every diet route, cold and no-oven routes, grill routes, big-batch routes, and low-cost routes — so the engine always has somewhere to go when a constraint bites.
- Library workshop gains counts and coverage warnings ("only 3 anchors survive your current filters").

## 2. Bulk import

- Drop in a CSV or JSON file of dishes and add them in one pass, not one form at a time.
- A downloadable template file with the exact columns and an example row.
- Import runs as a preview first: rows that will be added, rows that will overwrite an existing dish, rows rejected with the reason and line number. Nothing is written until you confirm.
- Choice on conflict: skip, overwrite, or keep both. Bulk export of the whole library back out as CSV.

## 3. Scenario preset management

- Scenarios become a managed collection rather than a fixed gallery: rename, duplicate, edit, delete, reorder, favourite, and tag your own; hide shipped ones you never use.
- Search and filter by shape, style, guest count, season and constraint.
- 20+ new situations added on top of the current 12, spanning tables, crowds, constraints and outdoors — for example: two-table dinner party, long-table twenty-four, kitchen-island supper for four, dietary-split table, potluck-anchored gathering, holiday open house, buffet for thirty, cocktail crowd of forty, no-fridge-space cook, single-burner flat, no-running-oven repair week, one-hour window, budget-capped crowd, allergy-cautious children's party, tailgate, beach picnic, rooftop reception, campsite cook, rain-contingency cookout, smoker-led day, breakfast-for-a-house-full, late-supper after an event.
- Scenarios travel in the existing JSON config export.

## 4. More operating conditions

New inputs, each with an explainer stating what it changes in the output:

- Table: table count, seats per table, courses served, plated vs family-style, place-setting turnover, table-side finishing allowed.
- Crowd: standing/seating ratio, arrival spread, refill cadence, serving stations, self-serve vs hosted, queue tolerance.
- Constraint: sink and dish-space, prep surfaces, single-burner mode, no-oven mode, cold-storage ceiling, power limits, noise/time curfew, shopping trips available, pantry-only mode, budget hard cap.
- Outdoor: grill type and fuel, smoker, fire pit, outdoor power and water, shade and weather risk, transport distance and cooler capacity, insect/heat holding limits.
- General: skill level, alcohol served, service duration, cleanup window, dietary strictness (preference vs strict avoidance).

Each new condition feeds the engine's load model, stop codes and menu selection — not decoration.

## 5. Accessibility, themes and mobile

- Three themes: parchment (light), ink (dark), and a high-contrast colour-blind-safe theme where every gauge and signal is distinguished by shape, label and pattern as well as colour, never colour alone.
- Full mobile re-composition of the workspace: conditions as a stepped sheet, plan as tabs, library as cards with a filter drawer, tap targets sized properly, no horizontal scroll, no clipped headers.
- Keyboard operation end to end, visible focus, correct labels on every control, live-region announcements when the plan recomputes, and reduced-motion respect.

## 6. Language switching

- English ships complete. Interface chrome, labels, explainers and glossary become translatable, with a language switcher and a second full locale (Spanish) to prove the system, remembered per device.
- Dish names, notes and ingredient lines stay in the language they were written in and are marked as such — machine-translating recipe content would mislead. If you want another locale, it is a translation file drop, no code change.

## 7. PDF and hand-off to a menu builder

- Direct PDF download of the host packet — menu, prep clock, service order and shopping list — as a proper multi-page file, in addition to the existing print path.
- Separate one-page menu card PDF suitable for the table.
- Menu builder hand-off: a dedicated screen that takes the generated plan into a menu you compose — reorder courses, rename dishes for the card, write menu-facing descriptions, set the header and date, choose a card layout, then export the finished menu as PDF, PNG, Markdown or JSON. Structured JSON is also exportable for any external menu tool.

## 8. Flow

- The workspace becomes a clear path — Conditions, Plan, Menu, Hand-off — with the current step always obvious, and a resume-where-you-left-off session so a refresh does not cost you the work.
- Blocking stops surface as a banner with the correction path rather than buried in the panel.

## Technical notes

- Dishes split across several fixture modules with a shared build-time uniqueness check; `resolveLibrary` merge layer is unchanged.
- New condition fields extend `Conditions` in `src/lib/oos/types.ts` with defaults, so existing saved scenarios and config files keep loading; config schema version bumps to 2 with a migration from 1.
- Bulk import: CSV parsed client-side, validated with the existing zod dish schema, reported as a diff before commit.
- PDF generated client-side from the packet markup; menu card is a separate template.
- Themes are token sets in `src/styles.css`; colour-blind theme adds pattern and glyph carriers on gauges.
- i18n as a small typed dictionary keyed per string, no heavy runtime; locale in localStorage with the existing theme key pattern.
- New routes: `/menu` (builder) alongside `/` and `/library`.

Scope note: this is a large single build. If you would rather land it in stages, the natural split is (a) data and conditions, (b) accessibility, themes and mobile, (c) menu builder, PDF and i18n.
