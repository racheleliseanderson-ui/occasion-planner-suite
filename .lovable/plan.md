# Avenue release: run control, global library, luxury theme, decision packet

Five pieces, all on the existing local-only architecture. No backend, no accounts, nothing leaves the device.

## 1. Run management — build console and service runner

**Build runs.** Computing a plan becomes an observable run rather than an invisible recalculation. A run console shows the four stages the engine actually performs — menu selection, resource load, schedule, cost and balance — each with status, elapsed time, and the stops or advisories it produced. Controls: run, step through one stage at a time, pause between stages, and re-run. Every completed run is kept in a local history strip with its verdict, feasibility and headline constraint; two runs can be compared field by field (reusing the existing diff view) and any past run can be restored as the current conditions.

**Service run.** A day-of runner drives the prep clock live: start the run, mark tasks done, late or skipped, and the remaining schedule re-times itself against real elapsed time. Owners can be reassigned mid-run. A status board shows what is behind, what is due next, and what has slack. The run state persists locally so closing the tab does not lose the evening, and it can be exited back to planning at any time.

Both surfaces state facts and margins — no encouragement, no reassurance.

## 2. Layout, accessibility and flow

- The planner recomposes into a clear three-movement flow: set conditions → run and read the verdict → hand off. The run console sits at the seam between two and three rather than being buried in the dashboard.
- One `<h1>` per route, correct heading order, landmark regions, skip link, and keyboard operability for every new control (run, step, pause, mark-done) with visible focus in all four themes.
- Live regions announce run stage changes, verdict changes and hard stops politely; the service runner announces the next due task.
- Mobile: the run console collapses into a compact stage strip; the service runner becomes a single-task-forward card with the board behind a toggle. 44px targets throughout.

## 3. Aesthetic — luxury editorial meets instrument

Maximalist Fifth Avenue: heavy display type at true poster scale, dense hairline rules, gold-leaf and stone tones against deep lacquer, plate-glass layering, generous but deliberately unequal spacing, oversized numerals for the gauges, and a strict typographic hierarchy running from display to small-caps rule labels to tabular mono data. Immersive touches — a stone-and-brass masthead, a full-bleed verdict field that takes its colour from the run outcome, marquee-style section openers — are used as structure, not decoration. Copy is precise, dry and honest: figures with their units, constraints named, no lifestyle language and no false certainty.

## 4. Avenue theme

A fourth theme, "Avenue", joining Parchment, Ink and Contrast, and set as the first-visit default. Lacquer black and warm stone fields, brass accents, a colour-safe signal set for under/at/over, heavier rules and a display-weight type ramp. The theme toggle carries four options; Contrast remains the accessible fallback and system contrast preference still wins on first visit. A matching Avenue PDF document style joins the existing Standard / Contrast / Large presets.

## 5. Decision packet

A new export distinct from the working packet: a short, defensible record of the decision. It states the verdict and why, the binding constraint and its margin, the two or three alternatives the engine ranked next and the exact reason each lost, the assumptions the plan rests on (guests, window, equipment, budget ceiling), what would have to change to flip the verdict, and the run signature and timestamp. Rendered on screen as a page and exported to PDF and Markdown in the selected document style, in either language.

## 6. Global expansion

A `cuisine` dimension added to the dish model, with roughly 12 regions: Mexican, Levantine, West African, Japanese, Indian, Thai/Vietnamese, Chinese, Persian, Greek/Turkish, Italian, Nordic and Caribbean. The 203 existing dishes get tagged, and ~120–150 new dishes are added across those regions, each with the full resource, cost, season and dietary metadata the engine needs. Cuisine becomes a filter in conditions and in the library workshop, and menu balance scoring learns to notice a menu that reads as an incoherent mix of traditions — reported as an observation, not a rule. Dish names stay in their own language with descriptive copy translated around them in both EN and ES.

## Technical notes

- Run stages are a small orchestrator around the existing pure `buildPlan`, so stepping is honest: each stage runs the real work, records timings and outputs, and the plan is only committed when the run completes. Run history and live service state persist through the existing Zod-validated local config store, capped and prunable.
- Avenue is a `.avenue` token block in `src/styles.css` alongside the existing `.dark` and `.contrast` sets; `useTheme`, the pre-hydration boot script and the toggle widen to four values with the stored value migrated forward.
- Cuisine ships as a new optional dish field with a normalisation default, new fixture modules per region, and bulk-import column support; share links and the config file keep working across the version bump.
- Decision packet reuses the existing PDF layout engine with a new composition; no new dependencies.
