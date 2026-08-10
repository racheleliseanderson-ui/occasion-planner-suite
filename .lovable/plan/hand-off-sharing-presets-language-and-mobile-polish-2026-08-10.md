# Hand-off, sharing, presets, language and mobile polish

## 1. PDF hand-off upgrade

Rewrite the packet generator so it composes pages rather than flowing text blindly:

- Real pagination: measured block heights, no orphaned headings or split table rows; running header (occasion + service time) and "Page n of m" footer on every page.
- Print typography: tighter measure, consistent baseline rhythm, small-caps section labels, tabular figures for clocks, quantities and costs; hairline rules instead of boxes.
- Style presets matching the on-screen theme: **Standard**, **High contrast** (pure black on white, heavier rules, no grey text), **Large font** (~130% type scale, single-column shopping list, fewer rows per page). The current theme preselects the matching preset; the host can override in the hand-off bar.
- Same presets applied to the typographic menu card.

## 2. Shareable read-only plan links

The link carries the plan itself — nothing is uploaded, no account, works offline.

- New route `/share` reads a compressed payload from the URL: conditions (including all operating conditions), the named kitchen profile used, the dish overrides/custom dishes the plan depends on, and a format version.
- Opening the link rebuilds the plan deterministically and renders a read-only dashboard: verdict, gauges, menu, prep clock, shopping list, hand-off exports (PDF/CSV/ICS/print). No editing, no writes to the recipient's saved config.
- A "Copy share link" control in the hand-off bar, with the encoded size shown and a warning if the payload grows past a safe URL length; in that case it offers "Copy compact link" (conditions + profile only, fixture dishes assumed) or a JSON file instead.
- An "Adopt this plan" button lets the recipient copy the conditions and profile into their own workshop, explicitly and only on click.

## 3. Scenario preset management

Upgrade the gallery from a flat list into a managed library:

- Search and filter by family, guest count and style; each card shows guests, style, service window and headline constraint.
- Saved presets: rename, edit note, duplicate, reorder (pin favourites to the top), delete with undo.
- Save the *full* current state as a preset — conditions plus operating conditions plus the active kitchen profile — instead of the partial patch saved today.
- Preset diff: when loading a preset over unsaved conditions, show exactly which fields will change before applying.
- Export/import presets as a JSON pack, so a set travels between devices alongside the existing config file.

## 4. Language switching (English + Spanish)

- Lightweight in-house i18n: typed string catalogues, a `useT()` hook, locale persisted per device and reflected in a `?lang=` search param so shared links open in the sender's language.
- Full coverage: interface, explainers/glossary, scenario names and notes, gauge labels, safety and dietary wording, and the PDF/Markdown/menu-card hand-offs.
- Dish names and notes stay in their original language with the descriptive copy translated around them; the fixture library is not machine-translated.
- `lang` attribute set on `<html>`, and locale-aware number and date formatting for costs, clocks and the `.ics` feed.

## 5. Mobile accessibility polish

- Tap targets at 44×44 minimum everywhere (steppers, toggles, theme switch, remove buttons), with visible focus rings in all three themes.
- Sticky verdict bar on small screens so feasibility and hard stops stay visible while scrolling the conditions.
- Conditions panel recomposed into collapsible, keyboard-reachable sections with proper `aria-expanded`, one visible `<h1>` per route, and correct heading order.
- Screen-reader announcements when the plan recomputes or a hard stop appears (polite live region), plus `aria-describedby` wiring for every explainer.
- `h-dvh` instead of `h-screen`, no horizontal overflow on the shopping and timeline tables, and reduced-motion respected.

## Technical notes

- URL payload: versioned JSON, minified key names, compressed and base64url-encoded into a search param validated with `fallback()`; unknown/corrupt payloads render a friendly "link can't be read" state rather than throwing.
- PDF work stays in `src/lib/oos/pdf.ts`, refactored into a small layout engine (measure → place → break) with a theme-preset object; jsPDF remains the renderer, generated entirely in the browser.
- i18n catalogues live under `src/lib/i18n/` with `en.ts` and `es.ts` typed against each other so a missing key is a build error.
- No backend, no Cloud, no data leaves the device.
