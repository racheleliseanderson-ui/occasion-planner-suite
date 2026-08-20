import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ThemeToggle } from "./ThemeToggle";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Layer = "plan" | "architecture" | "card" | "library";

function layerFromPath(pathname: string): Layer | null {
  if (pathname === "/" || pathname === "") return "plan";
  if (pathname.startsWith("/architecture") || pathname.startsWith("/recipes")) return "architecture";
  if (pathname.startsWith("/menu")) return "card";
  if (pathname.startsWith("/library")) return "library";
  return null;
}

const SUITE = [
  { id: "desk", href: "https://salty.saltnotes.blog/", label: "Desk" },
  { id: "kitchen", href: "https://kitchen.saltnotes.blog/", label: "Kitchen" },
  { id: "menu", href: "https://occasion.saltnotes.blog/architecture", label: "Menu", to: "/architecture" as const },
  { id: "occasion", href: "https://occasion.saltnotes.blog/", label: "Occasion", to: "/" as const },
  { id: "ri", href: "https://deepdish.saltnotes.blog/", label: "RI" },
] as const;

/**
 * Shared Occasions chrome. Plan / Architecture / Card is a layer switch —
 * same visual system, no restyle of the Plan surface.
 */
export function HostChrome({
  trailing,
  showPrint = false,
  onPrint,
}: {
  trailing?: ReactNode;
  showPrint?: boolean;
  onPrint?: () => void;
}) {
  const { t } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = layerFromPath(pathname);
  const menuCurrent =
    pathname.startsWith("/architecture") ||
    pathname.startsWith("/recipes") ||
    pathname.startsWith("/menu");
  const occasionCurrent = pathname === "/" || pathname === "";

  const layers: { id: Layer; to: "/" | "/architecture" | "/menu"; label: string }[] = [
    { id: "plan", to: "/", label: t("nav.plan") },
    { id: "architecture", to: "/architecture", label: t("nav.architecture") },
    { id: "card", to: "/menu", label: t("nav.card") },
  ];

  return (
    <header className="no-print sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-3">
          <Link to="/" className="truncate font-display text-lg tracking-tight">
            Occasion OS
          </Link>
          <span className="label-mono hidden sm:inline">Salty & Clever</span>
        </div>

        <nav
          aria-label={t("nav.layers")}
          className="order-last flex w-full flex-wrap items-center gap-1 border border-border sm:order-none sm:w-auto"
        >
          {layers.map((layer, i) => (
            <Link
              key={layer.id}
              to={layer.to}
              aria-current={active === layer.id ? "page" : undefined}
              className={cn(
                "min-h-11 px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors sm:min-h-0",
                i > 0 && "border-l border-border",
                active === layer.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {layer.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <Link
            to="/library"
            className={cn(
              "font-mono text-[11px] uppercase tracking-widest underline-offset-4 hover:underline",
              active === "library"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("nav.library")}
          </Link>
          {showPrint && (
            <button
              type="button"
              onClick={onPrint ?? (() => window.print())}
              className="border border-foreground px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
            >
              {t("action.print")}
            </button>
          )}
          {trailing}
        </div>
      </div>

      <nav
        aria-label="Salty & Clever suite"
        className="border-t border-border"
      >
        <div className="mx-auto flex max-w-6xl min-w-0 items-center gap-1 overflow-x-auto px-5 py-1.5">
          <span className="mr-2 hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-brass sm:inline">
            Suite
          </span>
          {SUITE.map((item) => {
            const current =
              item.id === "menu" ? menuCurrent : item.id === "occasion" ? occasionCurrent : false;
            const className = cn(
              "min-h-11 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors sm:min-h-0",
              current
                ? "text-brass"
                : "text-muted-foreground hover:text-foreground",
            );
            if ("to" in item && item.to) {
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  aria-current={current ? "page" : undefined}
                  className={className}
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <a
                key={item.id}
                href={item.href}
                className={className}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
