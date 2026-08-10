import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { BulkImport } from "@/components/oos/BulkImport";
import { DishEditor } from "@/components/oos/DishEditor";
import { ThemeToggle } from "@/components/oos/ThemeToggle";
import { GLOSSARY } from "@/lib/oos/explain";
import { FIXTURE_IDS, isFixture, resolveLibrary } from "@/lib/oos/library";
import {
  blankDish,
  clearConfig,
  deleteKitchenProfile,
  exportConfig,
  importConfig,
  resetDish,
  saveDish,
  saveKitchenProfile,
  toggleHidden,
  useConfig,
} from "@/lib/oos/store";
import { download } from "@/lib/oos/export";
import type { Course, Dish, Kitchen } from "@/lib/oos/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library workshop — tune the dishes and kitchen you actually have" },
      {
        name: "description",
        content:
          "Edit or hide fixture dishes, add your own, save kitchen equipment profiles, and carry the whole configuration between devices as one portable JSON file.",
      },
      { property: "og:title", content: "Library workshop — Occasion Operating System" },
      {
        property: "og:description",
        content:
          "Personalise the planning library: edit dish resource costs, add your own recipes, save kitchen profiles, export and import your configuration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryWorkshop,
});

const COURSES: (Course | "all")[] = ["all", "board", "starter", "anchor", "side", "bread", "sweet", "drink"];

const EMPTY_KITCHEN: Kitchen = {
  ovens: 1,
  burners: 4,
  grill: false,
  dishwasher: true,
  fridge: "normal",
  counter: "medium",
  seats: 8,
};

function LibraryWorkshop() {
  const config = useConfig();
  const library = useMemo(() => resolveLibrary(config), [config]);
  const all = useMemo(() => {
    const hidden = library.map((d) => d.id);
    const hiddenOnes = config.hiddenDishIds
      .map((id) => resolveLibraryLookup(id, config))
      .filter((d): d is Dish => Boolean(d) && !hidden.includes((d as Dish).id));
    return [...library, ...hiddenOnes];
  }, [library, config]);

  const [course, setCourse] = useState<Course | "all">("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Dish | null>(null);
  const [profileName, setProfileName] = useState("");
  const [kitchen, setKitchen] = useState<Kitchen>(EMPTY_KITCHEN);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = all
    .filter((d) => (course === "all" ? true : d.course === course))
    .filter((d) => (q ? d.name.toLowerCase().includes(q.toLowerCase()) : true))
    .sort((a, b) => a.course.localeCompare(b.course) || a.name.localeCompare(b.name));

  const editedCount = Object.keys(config.dishOverrides).length;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-baseline gap-3">
            <Link to="/" className="font-display text-lg tracking-tight">
              Occasion Operating System
            </Link>
            <span className="rule-label hidden sm:inline">Library workshop</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              to="/"
              className="border border-foreground px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
            >
              Back to planning
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-border bg-ink text-ink-foreground">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <span className="rule-label text-brass">Make the instrument yours</span>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1] tracking-tight sm:text-6xl">
            Your kitchen,
            <br />
            your dishes,
            <em className="not-italic text-brass"> your numbers.</em>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Every fixture is editable. Change what a dish costs you, how long your oven really takes,
            how many it serves at your table. Hide what you would never cook. Add your own. Everything
            stays in this browser and travels as one JSON file you own.
          </p>
          <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-6 border-t border-ink-muted/25 pt-5 font-mono text-[11px] uppercase tracking-wider sm:grid-cols-4">
            {[
              ["In library", String(library.length)],
              ["Your dishes", String(config.customDishes.length)],
              ["Edited fixtures", String(editedCount)],
              ["Hidden", String(config.hiddenDishIds.length)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-ink-muted">{k}</dt>
                <dd className="mt-1 text-2xl tabular-nums text-ink-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-14 px-5 py-12">
        {notice && (
          <p className="border-l-2 border-accent bg-card px-4 py-3 text-sm text-muted-foreground">{notice}</p>
        )}

        {editing ? (
          <DishEditor
            dish={editing}
            isFixture={isFixture(editing.id)}
            onCancel={() => setEditing(null)}
            onSave={(d) => {
              saveDish(d, isFixture(d.id));
              setEditing(null);
              setNotice(`${d.name} saved to your library.`);
            }}
          />
        ) : (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="rule-label">Section 01</span>
                <h2 className="mt-1 text-2xl tracking-tight">Dish library</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Resource numbers here are what the engine plans against. Edit them until they match
                  your kitchen rather than an average one.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(blankDish())}
                className="bg-foreground px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90"
              >
                Add a dish
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {COURSES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCourse(c)}
                  className={cn(
                    "border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
                    course === c
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/40",
                  )}
                >
                  {c}
                </button>
              ))}
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search dishes"
                maxLength={60}
                className="ml-auto border border-border bg-card px-3 py-1.5 text-sm"
              />
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[54rem] border-collapse text-sm">
                <thead>
                  <tr className="border-y border-foreground">
                    <th className="py-2 text-left rule-label">Dish</th>
                    <th className="py-2 text-left rule-label">Course</th>
                    <th className="py-2 text-right rule-label">Oven</th>
                    <th className="py-2 text-right rule-label">Burner</th>
                    <th className="py-2 text-right rule-label">Active</th>
                    <th className="py-2 text-right rule-label">Serves</th>
                    <th className="py-2 text-right rule-label">Cost</th>
                    <th className="py-2 text-right rule-label">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => {
                    const hidden = config.hiddenDishIds.includes(d.id);
                    const edited = Boolean(config.dishOverrides[d.id]);
                    const mine = !isFixture(d.id);
                    return (
                      <tr key={d.id} className={cn("border-b border-border", hidden && "opacity-45")}>
                        <td className="py-3 pr-4">
                          <span className="block">{d.name}</span>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {mine ? "yours" : edited ? "edited fixture" : "fixture"}
                            {hidden ? " · hidden" : ""}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          {d.course}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums">{d.ovenMin}</td>
                        <td className="py-3 text-right font-mono tabular-nums">{d.burnerMin}</td>
                        <td className="py-3 text-right font-mono tabular-nums">{d.activeMin}</td>
                        <td className="py-3 text-right font-mono tabular-nums">{d.servesPerBatch}</td>
                        <td className="py-3 text-right font-mono tabular-nums">
                          {(d.costPerGuest ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2 font-mono text-[10px] uppercase tracking-widest">
                            <button type="button" onClick={() => setEditing(d)} className="underline-offset-4 hover:underline">
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleHidden(d.id)}
                              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                            >
                              {hidden ? "Restore" : "Hide"}
                            </button>
                            {(edited || mine) && (
                              <button
                                type="button"
                                onClick={() => resetDish(d.id)}
                                className="text-muted-foreground underline-offset-4 hover:text-signal-over hover:underline"
                              >
                                {mine ? "Delete" : "Reset"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Kitchen profiles */}
        <section>
          <span className="rule-label">Section 02</span>
          <h2 className="mt-1 text-2xl tracking-tight">Kitchen profiles</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Save the equipment reality of a place — your kitchen, a rented house, a parent's kitchen —
            and load it into any plan in one click.
          </p>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
            <div className="paper px-5 py-5">
              <span className="rule-label">New profile</span>
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                maxLength={60}
                placeholder="Name this kitchen"
                className="mt-3 w-full border border-border bg-card px-3 py-2 text-sm"
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {([
                  ["ovens", "Ovens", 0, 4],
                  ["burners", "Burners", 0, 8],
                  ["seats", "Seats", 0, 60],
                ] as const).map(([key, label, min, max]) => (
                  <label key={key} className="block">
                    <span className="rule-label">{label}</span>
                    <input
                      type="number"
                      min={min}
                      max={max}
                      value={kitchen[key]}
                      onChange={(e) => setKitchen({ ...kitchen, [key]: Number(e.target.value) })}
                      className="mt-1.5 w-full border border-border bg-card px-2.5 py-2 font-mono text-sm tabular-nums"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="rule-label">Fridge</span>
                  <select
                    value={kitchen.fridge}
                    onChange={(e) => setKitchen({ ...kitchen, fridge: e.target.value as Kitchen["fridge"] })}
                    className="mt-1.5 w-full border border-border bg-card px-2.5 py-2 text-sm"
                  >
                    <option value="tight">tight</option>
                    <option value="normal">normal</option>
                    <option value="roomy">roomy</option>
                  </select>
                </label>
                <label className="block">
                  <span className="rule-label">Counter</span>
                  <select
                    value={kitchen.counter}
                    onChange={(e) => setKitchen({ ...kitchen, counter: e.target.value as Kitchen["counter"] })}
                    className="mt-1.5 w-full border border-border bg-card px-2.5 py-2 text-sm"
                  >
                    <option value="small">small</option>
                    <option value="medium">medium</option>
                    <option value="large">large</option>
                  </select>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {([
                  ["dishwasher", "Dishwasher"],
                  ["grill", "Outdoor grill"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setKitchen({ ...kitchen, [key]: !kitchen[key] })}
                    className={cn(
                      "border px-3 py-1.5 text-sm transition-colors",
                      kitchen[key]
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card hover:border-foreground/40",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!profileName.trim()}
                onClick={() => {
                  saveKitchenProfile(profileName.trim(), kitchen);
                  setNotice(`Kitchen profile "${profileName.trim()}" saved.`);
                  setProfileName("");
                }}
                className="mt-4 w-full bg-foreground px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Save profile
              </button>
            </div>

            <div>
              {config.kitchenProfiles.length === 0 ? (
                <p className="border-l-2 border-accent pl-3 text-sm text-muted-foreground">
                  No saved kitchens yet. Profiles appear on the planning page as one-click equipment loads.
                </p>
              ) : (
                <ul className="divide-y divide-border border-y border-border">
                  {config.kitchenProfiles.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                      <div>
                        <span className="text-sm">{p.name}</span>
                        <span className="ml-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.kitchen.ovens}o · {p.kitchen.burners}b · {p.kitchen.fridge} fridge ·{" "}
                          {p.kitchen.counter} counter · {p.kitchen.seats} seats
                          {p.kitchen.dishwasher ? " · dishwasher" : ""}
                          {p.kitchen.grill ? " · grill" : ""}
                        </span>
                      </div>
                      <div className="flex gap-3 font-mono text-[10px] uppercase tracking-widest">
                        <button
                          type="button"
                          onClick={() => setKitchen(p.kitchen)}
                          className="underline-offset-4 hover:underline"
                        >
                          Load into form
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteKitchenProfile(p.id)}
                          className="text-muted-foreground underline-offset-4 hover:text-signal-over hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Config portability */}
        <section>
          <span className="rule-label">Section 03</span>
          <h2 className="mt-1 text-2xl tracking-tight">Configuration file</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Your edits live in this browser only. Export to move them to another device, keep a backup,
            or hand your kitchen model to someone else.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => download("oos-config.json", "application/json", exportConfig())}
              className="border border-border bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground"
            >
              Export configuration
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="border border-border bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground"
            >
              Import configuration
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (file.size > 2_000_000) {
                  setNotice("That file is too large to be a configuration export.");
                  return;
                }
                const result = importConfig(await file.text());
                setNotice(result.ok ? "Configuration imported." : `Import refused — ${result.error}`);
              }}
            />
            <button
              type="button"
              onClick={() => {
                clearConfig();
                setNotice("Everything reset to the first-party fixture set.");
              }}
              className="border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-signal-over hover:text-signal-over"
            >
              Reset everything
            </button>
          </div>
        </section>

        {/* Bulk import */}
        <section>
          <span className="rule-label">Section 03b</span>
          <h2 className="mt-1 text-2xl tracking-tight">Bulk import</h2>
          <div className="mt-4">
            <BulkImport fixtureIds={FIXTURE_IDS} />
          </div>
        </section>



        {/* Glossary */}
        <section>
          <span className="rule-label">Section 04</span>
          <h2 className="mt-1 text-2xl tracking-tight">How the engine reads your numbers</h2>
          <dl className="mt-5 grid gap-px bg-border sm:grid-cols-2">
            {GLOSSARY.map((g) => (
              <div key={g.term} className="bg-card px-5 py-4">
                <dt className="text-sm font-medium">{g.term}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{g.body}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="border-t border-border bg-ink text-ink-muted">
        <div className="mx-auto max-w-6xl px-5 py-10 text-sm">
          <p className="max-w-xl leading-relaxed">
            Educational planning only. Dish data you enter is stored in your browser, never uploaded,
            and dietary tags remain planning filters rather than allergen guarantees.
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Hidden dishes still need to be listed so they can be restored. */
function resolveLibraryLookup(id: string, config: ReturnType<typeof useConfig>): Dish | undefined {
  const custom = (config.customDishes as unknown as Dish[]).find((d) => d.id === id);
  if (custom) return custom;
  const base = resolveLibrary({ ...config, hiddenDishIds: [] }).find((d) => d.id === id);
  return base;
}
