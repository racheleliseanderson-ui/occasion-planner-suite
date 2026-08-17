# Occasion Operating System

Salty & Clever host-planning instrument. Four layers, one visual system:

| Layer | Path | What it does |
| --- | --- | --- |
| **Plan** | `/` | Feasibility, shopping, prep clock, service, host packet |
| **Architecture** | `/architecture` | Original five-role menu builder — scenarios, lock-an-anchor, stress, service plan, recipes |
| **Card** | `/menu` | Printable guest card |
| **Library** | `/library` | Workshop the dish fixture library |
| **House return** | saltnotes.blog/reading-desk | Sends the surviving menu back to the site with related essays and recipes |

Live: [occasion.saltnotes.blog](https://occasion.saltnotes.blog)

## Architecture is a real menu builder

Not a stub. The original Salty Menu Builder engine lives inside this suite:

- Eleven starting situations (weeknight, birthday, holiday, open house, plated stress, Sunday lunch, vegetarian dinner, egg-free brunch, cocktail hour, high-country, no-oven reception)
- Five roles: Welcome · Anchor · Contrast · Relief · Finish
- Stress test across balance, make-ahead, service fit, equipment fit, host freedom
- Anchor locking + flavor-family re-score
- A planning recipe for every catalog dish
- Service plan: prep timeline, aisle shopping, service run
- Review-then-apply handoff to Plan — Plan scores the locked menu and does not silently replace it
- House return — Architecture, Plan and Card can send a brief back to [saltnotes.blog/reading-desk](https://saltnotes.blog/reading-desk/) with the dishes and the editorial pieces that belong next to them. No guest names. No invented seats.

```
src/lib/architecture/     catalog, evaluate, recipes, plan, contract, bridge
src/lib/oos/              Plan engine, fixtures, share, store
src/components/oos/       ArchitectureSurface, DishPlan, StressMeters, PlanSurface
src/routes/recipes.$dishId.tsx
```

## Fail-closed rules (do not break)

- Seats are never invented from guest count
- Limited equipment is not absent (limited oven = 1 oven, limited burners = 2)
- Egg is `no-egg`, never mapped to vegetarian
- An approved Architecture is locked on Plan — not replaced
- Dietary tags are planning filters, not allergen-safe claims

## Scripts

```bash
npm run dev          # 0.0.0.0:8080
npm run build
npm run typecheck
npm test             # P0 invariants
```

Standalone Menu Builder (same engine, separate app): [salty-menu-builder](https://github.com/racheleliseanderson-ui/salty-menu-builder)
