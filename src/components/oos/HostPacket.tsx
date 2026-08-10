import type { Plan } from "@/lib/oos/types";
import { DIET_LABELS } from "@/lib/oos/engine";
import { useT } from "@/lib/i18n";



export function HostPacket({ plan }: { plan: Plan }) {
  const c = plan.conditions;
  const { t } = useT();
  const WHEN_LABEL = { d2: t("packet.d2"), d1: t("packet.d1"), dayof: t("packet.dayof") } as const;
  return (
    <article className="paper packet-page px-6 py-8 sm:px-10 sm:py-12">
      <header className="border-b border-foreground pb-6">
        <span className="rule-label">{t("packet.eyebrow")}</span>
        <h2 className="mt-2 font-display text-4xl tracking-tight">{c.label}</h2>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {c.guests} {t("packet.guests")} · {c.style} · {t("packet.service")} {c.serviceTime} · {c.kitchen.ovens} oven
          {c.kitchen.ovens === 1 ? "" : "s"} / {c.kitchen.burners} burners ·{" "}
          {c.helpers === 0 ? t("packet.solo") : `${c.helpers} helper${c.helpers === 1 ? "" : "s"}`}
        </p>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          Feasibility {plan.feasibility}/100 · balance {plan.balance}/100 · {plan.verdict} ·{" "}
          {plan.stops.length} hard stop{plan.stops.length === 1 ? "" : "s"} ·{" "}
          {c.diets.length ? c.diets.map((d) => DIET_LABELS[d]).join(", ") : "no dietary filters"}
        </p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          {c.season} · indicative cost {plan.costPerHead.toFixed(2)}/head · {plan.costTotal} total
          (ceiling {plan.costCeiling}) · leftovers: {c.leftovers}
          {c.kids ? " · children present" : ""}
          {c.outdoor ? " · outdoor space" : ""}
        </p>

      </header>

      {plan.stops.length > 0 && (
        <section className="packet-page mt-8">
          <span className="rule-label">{t("packet.blocked")}</span>
          <ul className="mt-3 space-y-3">
            {plan.stops.map((s) => (
              <li key={s.code} className="border-l-2 border-signal-over pl-3">
                <p className="text-sm font-medium">
                  {s.code} — {s.title}
                </p>
                <p className="text-sm text-muted-foreground">{s.detail}</p>
                <p className="text-sm">{t("packet.correction")} {s.correction}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="packet-page mt-8">
        <span className="rule-label">{t("packet.01")}</span>
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {plan.menu.map((m) => (
            <li key={m.dish.id} className="flex flex-wrap justify-between gap-3 py-2">
              <span className="text-sm">
                <span className="font-medium">{m.dish.name}</span>
                <span className="ml-2 text-muted-foreground">{m.dish.course}</span>
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {WHEN_LABEL[m.when]} · {m.batches}× · serves {m.serves}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="packet-page mt-8">
        <span className="rule-label">{t("packet.02")}</span>
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {plan.gauges.map((g) => (
            <li key={g.key} className="flex justify-between gap-3 py-2 text-sm">
              <span>{g.name}</span>
              <span className="font-mono text-xs tabular-nums">
                {g.used}/{g.capacity} {g.unit} · {g.pct > 400 ? "—" : `${g.pct}%`} · {g.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="packet-page mt-8">
        <span className="rule-label">{t("packet.03")}</span>
        <ul className="mt-3 grid gap-x-8 border-t border-border sm:grid-cols-2">
          {plan.shopping.map((l) => (
            <li key={l.item} className="flex justify-between gap-3 border-b border-border py-2 text-sm">
              <span>
                <span className="mr-2 inline-block h-3 w-3 border border-foreground align-middle" />
                {l.item}
                <span className="ml-2 text-[11px] uppercase text-muted-foreground">{l.aisle}</span>
              </span>
              <span className="font-mono text-xs tabular-nums">
                {l.qty} {l.unit}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="packet-page mt-8">
        <span className="rule-label">{t("packet.04")}</span>
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {plan.timeline.map((t, i) => (
            <li key={i} className="grid gap-1 py-2 sm:grid-cols-[7rem_1fr]">
              <span className="font-mono text-xs tabular-nums">{t.clock}</span>
              <span className="text-sm">
                <span className="font-medium">{t.dish}</span> — {t.task}
                {t.minutes > 0 ? ` (${t.minutes} min)` : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="packet-page mt-8">
        <span className="rule-label">{t("packet.05")}</span>
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {plan.service.map((s, i) => (
            <li key={i} className="grid gap-1 py-2 sm:grid-cols-[7rem_1fr]">
              <span className="font-mono text-xs tabular-nums">{s.clock}</span>
              <span className="text-sm">
                {s.task}
                <span className="ml-2 text-muted-foreground">{s.dish}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-10 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        {t("packet.footer")} <span className="font-mono">{plan.signature}</span>
      </footer>
    </article>
  );
}
