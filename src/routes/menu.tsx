import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/oos/ThemeToggle";
import { takeMenu } from "@/lib/oos/handoff";
import { menuCardPdf } from "@/lib/oos/pdf";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu builder — set the card that goes on the table" },
      {
        name: "description",
        content:
          "Turn a finished plan into a printed menu card: reorder courses, rewrite each line in your own words, and export a typographic PDF for the table.",
      },
      { property: "og:title", content: "Menu builder — Occasion Operating System" },
      {
        property: "og:description",
        content:
          "Reorder courses, rewrite the wording, and export a typographic menu card as PDF. Everything stays in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenuBuilder,
});

interface Line {
  id: string;
  name: string;
  note: string;
  course: string;
  show: boolean;
  showCourse: boolean;
}

const COURSE_ORDER = ["board", "starter", "anchor", "side", "bread", "sweet", "drink"];

const btn =
  "min-h-11 border border-border bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground";

function MenuBuilder() {
  const [lines, setLines] = useState<Line[]>([]);
  const [title, setTitle] = useState("A table for the evening");
  const [subtitle, setSubtitle] = useState("");
  const [footer, setFooter] = useState("Ingredients on request. Please tell us about any avoidance.");
  const [size, setSize] = useState<"a5" | "a4">("a5");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handoff = takeMenu();
    if (handoff) {
      setTitle(handoff.label);
      setSubtitle(`${handoff.guests} at table · ${handoff.serviceTime}`);
      setLines(
        [...handoff.items]
          .sort((a, b) => COURSE_ORDER.indexOf(a.course) - COURSE_ORDER.indexOf(b.course))
          .map((i) => ({ ...i, show: i.course !== "drink", showCourse: true })),
      );
    }
    setLoaded(true);
  }, []);

  const shown = lines.filter((l) => l.show);

  function patch(id: string, next: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...next } : l)));
  }

  function move(index: number, delta: number) {
    setLines((ls) => {
      const next = [...ls];
      const target = index + delta;
      if (target < 0 || target >= next.length) return ls;
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row!);
      return next;
    });
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-baseline gap-3">
            <Link to="/" className="truncate font-display text-lg tracking-tight">
              Occasion Operating System
            </Link>
            <span className="rule-label hidden sm:inline">Menu builder</span>
          </div>
          <div className="flex items-center gap-3">
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
          <span className="rule-label text-brass">The card on the table</span>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1] tracking-tight sm:text-6xl">
            The plan cooks.
            <br />
            <em className="not-italic text-brass">The card speaks.</em>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            The menu arrives from the planner in course order. Rewrite every line in your own words,
            drop what the table does not need to read, and take away a typographic card.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-12 px-5 py-14">
        {loaded && lines.length === 0 && (
          <p className="border-l-2 border-accent bg-card px-5 py-4 text-sm leading-relaxed">
            Nothing has been handed over yet. Build a route on the planner, then use{" "}
            <span className="font-mono text-xs uppercase tracking-widest">Send to menu builder</span>{" "}
            on the plan — or write the card from scratch below.
          </p>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="space-y-6">
            <div>
              <span className="rule-label">Section 01</span>
              <h2 className="mt-1 text-2xl tracking-tight">Wording</h2>
            </div>

            <label className="block">
              <span className="rule-label">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full border border-border bg-card px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="rule-label">Standfirst</span>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Eight at table · 19:00"
                className="mt-2 w-full border border-border bg-card px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="rule-label">Foot note</span>
              <input
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                className="mt-2 w-full border border-border bg-card px-3 py-2 text-sm"
              />
            </label>

            <div>
              <span className="rule-label">Card size</span>
              <div className="mt-2 flex gap-1.5">
                {(["a5", "a4"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={size === s}
                    onClick={() => setSize(s)}
                    className={cn(
                      "min-h-11 border px-3 py-1.5 text-sm uppercase transition-colors sm:min-h-0",
                      size === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card hover:border-foreground/40",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="rule-label">Section 02</span>
              <h2 className="mt-1 text-2xl tracking-tight">Lines</h2>
              <div className="mt-4 space-y-px bg-border">
                {lines.map((l, i) => (
                  <div key={l.id} className="bg-card px-4 py-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <input
                        value={l.name}
                        onChange={(e) => patch(l.id, { name: e.target.value })}
                        aria-label="Dish name"
                        className="w-full border-b border-transparent bg-transparent pb-1 text-sm focus:border-border focus:outline-none"
                      />
                      <div className="flex shrink-0 gap-1">
                        <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="min-h-11 px-2 text-muted-foreground hover:text-foreground sm:min-h-0">
                          ↑
                        </button>
                        <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="min-h-11 px-2 text-muted-foreground hover:text-foreground sm:min-h-0">
                          ↓
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={l.note}
                      onChange={(e) => patch(l.id, { note: e.target.value })}
                      aria-label="Description"
                      rows={2}
                      className="mt-2 w-full resize-none border border-border bg-background px-2 py-1.5 text-xs leading-relaxed"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        aria-pressed={l.show}
                        onClick={() => patch(l.id, { show: !l.show })}
                        className={cn(
                          "border px-2 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors",
                          l.show ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground",
                        )}
                      >
                        {l.show ? "On the card" : "Hidden"}
                      </button>
                      <button
                        type="button"
                        aria-pressed={l.showCourse}
                        onClick={() => patch(l.id, { showCourse: !l.showCourse })}
                        className={cn(
                          "border px-2 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors",
                          l.showCourse ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground",
                        )}
                      >
                        Course label
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setLines((ls) => [
                    ...ls,
                    {
                      id: `line-${Date.now().toString(36)}`,
                      name: "New line",
                      note: "",
                      course: "side",
                      show: true,
                      showCourse: false,
                    },
                  ])
                }
                className={cn(btn, "mt-3")}
              >
                Add a line
              </button>
            </div>
          </section>

          <section className="lg:sticky lg:top-24 lg:self-start">
            <span className="rule-label">Preview</span>
            <div className="mt-3 border border-border bg-card p-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {subtitle}
              </p>
              <h3 className="mt-4 font-display text-3xl leading-tight tracking-tight">{title}</h3>
              <div className="mx-auto mt-5 h-px w-12 bg-border" />
              <ul className="mt-6 space-y-5">
                {shown.map((l) => (
                  <li key={l.id}>
                    {l.showCourse && (
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                        {l.course}
                      </p>
                    )}
                    <p className="mt-1 text-base">{l.name}</p>
                    {l.note && (
                      <p className="mt-1 text-xs italic leading-relaxed text-muted-foreground">{l.note}</p>
                    )}
                  </li>
                ))}
              </ul>
              {footer && (
                <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  {footer}
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={shown.length === 0}
              onClick={() =>
                menuCardPdf(
                  {
                    title,
                    subtitle,
                    footer,
                    items: shown.map((l) => ({
                      name: l.name,
                      note: l.note,
                      course: l.showCourse ? l.course : undefined,
                    })),
                  },
                  size,
                )
              }
              className="mt-4 min-h-11 w-full border border-foreground bg-foreground px-4 py-2.5 text-sm text-background transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              Download menu card PDF
            </button>
            <p className="mt-3 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
              The card is drawn in your browser and never uploaded. It carries no allergen claim —
              a printed menu is not a substitute for telling a guest what is in the dish.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
