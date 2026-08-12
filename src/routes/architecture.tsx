import { createFileRoute } from "@tanstack/react-router";
import { HostChrome } from "@/components/oos/HostChrome";
import { ArchitectureSurface } from "@/components/oos/ArchitectureSurface";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/architecture")({
  validateSearch: (search: Record<string, unknown>) => ({
    p: typeof search['p'] === "string" ? search['p'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Architecture — menu the kitchen can finish · Occasion OS" },
      {
        name: "description",
        content:
          "Five-role menu architecture and stress test inside Occasion Operating System. Apply a validated packet to Plan when hard stops are clear.",
      },
    ],
  }),
  component: ArchitecturePage,
});

function ArchitecturePage() {
  const { t } = useT();
  const { p } = Route.useSearch();

  return (
    <div className="min-h-dvh">
      <HostChrome />

      <section className="border-b border-border bg-ink text-ink-foreground">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <span className="rule-label text-brass">{t("arch.hero.eyebrow")}</span>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1] tracking-tight sm:text-6xl">
            {t("arch.hero.title.1")}
            <br />
            <em className="not-italic text-brass">{t("arch.hero.title.2")}</em>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-muted">{t("arch.hero.body")}</p>
          <p className="mt-4 max-w-xl border border-ink-muted/30 bg-ink/40 px-4 py-3 text-xs leading-relaxed text-ink-muted">
            {t("arch.hero.boundary")}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-14">
        <ArchitectureSurface initialToken={p ?? null} />
      </main>
    </div>
  );
}
