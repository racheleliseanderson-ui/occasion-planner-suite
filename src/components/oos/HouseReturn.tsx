import { useState } from "react";
import { houseReturnUrl, type HouseReturnPayload } from "@/lib/house/return";
import { HOUSE_ORIGIN } from "@/lib/house/atlas";
import { cn } from "@/lib/utils";

const btn =
  "min-h-11 border border-border bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground";
const btnPrimary =
  "min-h-11 border border-foreground bg-foreground px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-background transition-opacity hover:opacity-85";

const KIND_LABEL: Record<HouseReturnPayload["reading"][number]["kind"], string> = {
  house: "Desk",
  hosting: "Hosting",
  recipe: "Recipe",
  drink: "Drink",
  essay: "Essay",
  menu: "Menu",
};

export function HouseReturn({
  payload,
  compact = false,
}: {
  payload: HouseReturnPayload | null;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!payload) return null;
  const url = houseReturnUrl(payload);

  const openSite = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className={cn("border border-border bg-card", compact ? "px-4 py-4" : "px-5 py-5")}>
      <span className="rule-label">Return to the house</span>
      <h3 className="mt-1 font-display text-xl tracking-tight sm:text-2xl">
        This plan has a reading desk
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        The tools can hand a menu to each other. They can also send you back to{" "}
        <a href={HOUSE_ORIGIN} className="underline underline-offset-4 hover:text-foreground">
          saltnotes.blog
        </a>{" "}
        with the dishes that survived — and the pieces that actually belong next to them. No guest
        names travel. No invented seats.
      </p>

      {!compact && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {payload.dishes.slice(0, 8).map((dish) => (
            <li
              key={dish.id}
              className="border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest"
            >
              {dish.course ? `${dish.course} · ` : ""}
              {dish.name}
            </li>
          ))}
        </ul>
      )}

      <ol className="mt-4 divide-y divide-border border border-border">
        {payload.reading.map((piece) => (
          <li key={piece.url}>
            <a
              href={piece.url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex min-h-11 items-baseline justify-between gap-4 px-3 py-2.5 hover:bg-secondary"
            >
              <span className="text-sm leading-snug">{piece.title}</span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {KIND_LABEL[piece.kind]} ↗
              </span>
            </a>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={openSite}>
          Continue on saltnotes.blog
        </button>
        <button type="button" className={btn} onClick={copy}>
          {copied ? "Reading-desk link copied" : "Copy desk link"}
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {payload.seatingKnown === false
          ? "Seats were not declared. The site will not invent chairs either."
          : `${payload.guests} guests · ${payload.dishes.length} dishes on the brief.`}
      </p>
    </section>
  );
}
