import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

type Item =
  | { id: string; label: string; to: "/" | "/architecture" | "/menu" | "/library" }
  | { id: string; label: string; href: string };

/** One row, six items maximum. */
const NAV: Item[] = [
  { id: "plan", label: "Plan", to: "/" },
  { id: "menu", label: "Menu Builder", to: "/architecture" },
  { id: "serve", label: "Service Card", to: "/menu" },
  { id: "library", label: "Library", to: "/library" },
];

function isCurrent(pathname: string, to: string) {
  if (to === "/") return pathname === "/" || pathname === "";
  if (to === "/architecture") return pathname.startsWith("/architecture") || pathname.startsWith("/recipes");
  return pathname.startsWith(to);
}

/**
 * Northern Lantern House fleet house bar: one row, gold Labs wordmark,
 * publication name, app nav, compact display-mode pill.
 */
export function HouseBar({
  trailing,
  showPrint = false,
  onPrint,
}: {
  trailing?: ReactNode;
  showPrint?: boolean;
  onPrint?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="no-print sticky top-0 z-30 border-b border-border bg-background/92 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-2.5">
        <a
          href="https://northernlanternhouse.com"
          target="_blank"
          rel="noopener"
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-gold hover:underline"
        >
          Northern Lantern House Labs
        </a>
        <Link to="/" className="shrink-0 font-display text-lg leading-none tracking-tight">
          Salty &amp; Clever
        </Link>

        <nav aria-label="Occasion OS" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const current = "to" in item ? isCurrent(pathname, item.to) : false;
            const className = cn(
              "shrink-0 px-2.5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors",
              current ? "text-accent" : "text-muted-foreground hover:text-foreground",
            );
            return "to" in item ? (
              <Link
                key={item.id}
                to={item.to}
                aria-current={current ? "page" : undefined}
                className={className}
              >
                {item.label}
              </Link>
            ) : (
              <a key={item.id} href={item.href} target="_blank" rel="noopener" className={className}>
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="inline-flex items-center rounded-full border border-border px-1 py-0.5">
            <ThemeToggle />
          </div>
          {showPrint && (
            <button
              type="button"
              onClick={onPrint ?? (() => window.print())}
              className="border border-foreground px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
            >
              Print
            </button>
          )}
          {trailing}
        </div>
      </div>
    </header>
  );
}
