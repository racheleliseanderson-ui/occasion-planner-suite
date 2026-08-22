const HOUSE = "https://northernlanternhouse.com";

const THIS_PUBLICATION: { label: string; href: string }[] = [
  { label: "Salty & Clever", href: "https://saltnotes.blog" },
  { label: "Salty Desk", href: "https://salty.saltnotes.blog" },
  { label: "Restaurant Intelligence", href: "https://deepdish.saltnotes.blog" },
  { label: "Occasion OS", href: "https://occasion.saltnotes.blog" },
  { label: "Menu Builder", href: "https://occasion.saltnotes.blog/architecture" },
  { label: "Kitchen & Bar", href: "https://kitchen.saltnotes.blog" },
];

const FLEET: { label: string; href: string }[] = [
  { label: "Tangled Thistle", href: "https://tangledthistle.blog" },
  { label: "Atmosphere OS", href: "https://atmosphere.tangledthistle.blog" },
  { label: "Venue Intelligence", href: "https://venue.tangledthistle.blog" },
  { label: "Vanity or Vice", href: "https://vanityvice.blog" },
  { label: "Makeup Intelligence", href: "https://makeup.vanityvice.blog" },
  { label: "Spa Intelligence", href: "https://spa.vanityvice.blog" },
  { label: "Skincare Desk", href: "https://skincare.vanityvice.blog" },
  { label: "Room for Drama", href: "https://dramaroom.blog" },
  { label: "Hook the Horizon", href: "https://hookthehorizon.blog" },
  { label: "Elsewhere, Apparently", href: "https://the-money-apparently.vercel.app" },
];

function Out({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="block py-1 text-ink-muted transition-colors hover:text-ink-foreground"
    >
      {children}
    </a>
  );
}

/** Northern Lantern House Labs footer — identical across the fleet. */
export function LabsFooter() {
  return (
    <footer className="no-print bg-ink text-ink-muted">
      <div className="h-px w-full bg-gold" />
      <div className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="font-display text-2xl tracking-tight text-ink-foreground">
          Northern Lantern House Labs
        </h2>

        <div className="mt-8 grid gap-10 text-sm sm:grid-cols-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">The House</p>
            <p className="mt-3 max-w-xs leading-relaxed">
              Independent publications and the decision instruments built for them.
            </p>
            <div className="mt-3">
              <Out href={HOUSE}>northernlanternhouse.com ↗</Out>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
              This publication
            </p>
            <div className="mt-3">
              {THIS_PUBLICATION.map((l) => (
                <Out key={l.href} href={l.href}>
                  {l.label}
                </Out>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
              Across the fleet
            </p>
            <div className="mt-3">
              {FLEET.map((l) => (
                <Out key={l.href} href={l.href}>
                  {l.label}
                </Out>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink-muted/25 pt-5 font-mono text-[10px] uppercase tracking-[0.18em]">
          <span>© 2026 Northern Lantern House</span>
          <Out href={`${HOUSE}/legal-accessibility`}>Legal &amp; Accessibility</Out>
          <Out href={`${HOUSE}/support`}>Support</Out>
        </div>
      </div>
    </footer>
  );
}
