/**
 * English is the source catalogue. Every other locale is typed against it, so a
 * missing or stray key is a build error rather than a half-translated screen.
 */
export const en = {
  // ---- chrome
  "app.name": "Occasion Operating System",
  "app.house": "Salty & Clever",
  "nav.library": "Library workshop",
  "nav.restaurant": "Restaurant Intelligence ↗",
  "nav.planner": "← Planner",
  "action.print": "Print packet",
  "lang.label": "Language",

  // ---- hero
  "hero.eyebrow": "Host planning instrument · v2",
  "hero.title.1": "Plan the night",
  "hero.title.2": "you can",
  "hero.title.3": "actually",
  "hero.title.4": "host.",
  "hero.body":
    "Guest count, seating, real equipment, and dietary categories go in. A controlled route comes out — shopping, prep clock, service sequence, and an honest reading of where the evening is tight. Nothing is invented. When a plan cannot fit, it stops and tells you why.",
  "hero.boundary": "Boundary",
  "hero.boundary.body":
    "Educational planning only. Fixture menus, not tested recipes. Dietary categories are planning filters and carry no allergen safety guarantee. Capacity, equipment, and time constraints fail closed rather than guess.",

  // ---- scenarios
  "scen.eyebrow": "Starting conditions",
  "scen.title": "Real situations, ready to load",
  "scen.body":
    "Load one, then move a single input to see what it costs you. Your own conditions can be saved, pinned, renamed and carried between devices.",
  "scen.tune": "Tune the library →",
  "scen.search": "Search situations",
  "scen.searchPlaceholder": "Search by name, note or constraint",
  "scen.all": "All",
  "scen.none": "No situation matches that search.",
  "scen.saved": "Your saved conditions",
  "scen.savedNone": "Nothing saved yet. Build a route, name it, and it lands here.",
  "scen.pin": "Pin",
  "scen.unpin": "Unpin",
  "scen.rename": "Rename",
  "scen.duplicate": "Duplicate",
  "scen.remove": "Remove",
  "scen.undo": "Undo",
  "scen.removed": "Removed",
  "scen.exportPack": "Export preset pack",
  "scen.importPack": "Import preset pack",
  "scen.savedBy": "saved by you",
  "scen.load": "Load",
  "scen.diffTitle": "What loading this changes",
  "scen.diffApply": "Apply preset",
  "scen.diffCancel": "Keep current conditions",
  "scen.diffNone": "Nothing changes — these conditions are already loaded.",
  "scen.guests": "guests",

  // ---- workspace
  "work.section02": "Section 02",
  "work.route": "Controlled route",
  "work.build": "Build controlled route",
  "work.rebuild": "Rebuild route",
  "work.reset": "Reset",
  "work.saveVariation": "Save as variation",
  "work.nameConditions": "Name these conditions",
  "work.saveScenario": "Save scenario",
  "work.empty.title": "Empty on purpose",
  "work.empty.body":
    "Nothing is generated until conditions are declared. Set guests, seats, equipment and hands on the left, then build. If the route cannot fit what you have, the system blocks with a correction path rather than guessing.",
  "work.step1": "Declare",
  "work.step1.body": "Guests, seats, ovens, burners, cold storage, hands, time.",
  "work.step2": "Build",
  "work.step2.body": "A route scored against your real constraints.",
  "work.step3": "Refine",
  "work.step3.body": "Adjust one input, compare variations, then print the packet.",
  "work.section03": "Section 03",
  "work.variations": "Variation comparison",
  "work.variations.body":
    "Saved assumptions held side by side. Compare the cost of one more guest, one fewer burner, or one lost helper before you commit.",
  "work.clearVariations": "Clear saved variations",
  "work.section04": "Section 04",
  "work.packet": "Host decision packet",
  "work.packet.body": "One document to carry into the kitchen. Prints clean on paper.",
  "work.rebuilt": "Route rebuilt.",
  "work.stopsPresent": "Route rebuilt with hard stops to resolve.",

  // ---- table headings
  "tbl.variation": "Variation",
  "tbl.guests": "Guests",
  "tbl.feasibility": "Feasibility",
  "tbl.oven": "Oven",
  "tbl.labour": "Labour",
  "tbl.stops": "Stops",
  "tbl.current": "Current build",

  // ---- hand-off
  "ho.title": "Hand-off",
  "ho.md": "Markdown packet",
  "ho.shopping": "Shopping CSV",
  "ho.clock": "Prep clock CSV",
  "ho.json": "JSON",
  "ho.pdf": "Packet PDF",
  "ho.menuBuilder": "Send to menu builder",
  "ho.date": "Occasion date",
  "ho.ics": "Calendar .ics",
  "ho.note":
    "Files are generated in your browser and never uploaded. The calendar feed places every prep and service step relative to the declared service time on the date you choose.",
  "ho.pdfStyle": "PDF style",
  "ho.pdf.standard": "Standard",
  "ho.pdf.contrast": "High contrast",
  "ho.pdf.large": "Large font",
  "ho.share": "Copy share link",
  "ho.shareCompact": "Copy compact link",
  "ho.shareFile": "Download plan file",
  "ho.shareCopied": "Link copied to the clipboard.",
  "ho.shareSize": "Link length",
  "ho.shareLong":
    "This link carries your edited dishes and is long enough that some apps will break it. Use the compact link or the plan file instead.",
  "ho.shareNote":
    "A share link carries the whole plan inside the address itself. Nothing is uploaded, no account is needed, and the recipient can read it offline.",

  // ---- share route
  "share.eyebrow": "Read-only hand-off",
  "share.title": "Shared plan",
  "share.body":
    "This plan was rebuilt from the link itself. Nothing was uploaded and nothing here writes to your own saved workshop.",
  "share.adopt": "Adopt these conditions",
  "share.adopted": "Copied into your workshop — open the planner to continue.",
  "share.open": "Open the planner",
  "share.bad.title": "This link can't be read",
  "share.bad.body":
    "The address is incomplete or was written by a different version of the instrument. Ask the sender for a fresh link, or start a plan of your own.",
  "share.loading": "Rebuilding the plan…",

  // ---- packet
  "packet.eyebrow": "Host decision packet · Salty & Clever",
  "packet.guests": "guests",
  "packet.service": "service",
  "packet.solo": "solo",
  "packet.blocked": "Blocked — resolve before shopping",
  "packet.correction": "Correction:",
  "packet.01": "01 · Controlled route",
  "packet.02": "02 · Where the plan is tight",
  "packet.03": "03 · Shopping list",
  "packet.04": "04 · Prep clock",
  "packet.05": "05 · Service sequence",
  "packet.footer":
    "Educational planning tool. Fixture menus, not tested recipes, live prices, or professional food-service certification. Dietary categories are planning filters only and carry no allergen safety guarantee — confirm ingredients and cross-contact yourself. Cool leftovers within two hours. Signature:",
  "packet.d2": "Two days out",
  "packet.d1": "Day before",
  "packet.dayof": "Day of",
} as const;

export type Catalogue = Record<keyof typeof en, string>;
