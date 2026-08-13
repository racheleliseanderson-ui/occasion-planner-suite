# Occasion Planner Suite

Improve this existing live application: 

Use the current live version as the baseline. Do not start from scratch — elevate what already exists.

Git Hub https://github.com/racheleliseanderson-ui/occasion-operating-system

Current application: https://occasion.saltnotes.blog

Upgrade the Occasion Operating System (Salty & Clever) into a high-end, standalone host-planning instrument. Strengthen it as the primary tool for planning a night at home.

### Core Philosophy (do not break)

- Educational planning tool only — never present as professional kitchen, medical, or legal advice

- Dietary categories are planning filters only — no allergen safety guarantees

- First-party evidence and explicit boundaries

- Fail-closed on capacity, equipment, and hard constraints

- Explicit, reader-controlled actions only

- No invented claims or silent assumptions

### Scope Clarification

- Make Occasion Operating System the clear focus of this application

- Keep any link to Restaurant Intelligence clean and external (it is now a separate standalone app)

- Do not embed or tightly couple Restaurant Intelligence functionality inside this app

### Intelligence Upgrades

Make the planning engine significantly smarter and more useful:

- Strengthen the conversion of guest count + seating style + equipment reality + dietary categories + occasion type into a realistic controlled route (shop → prep → serve)

- Improve stress and feasibility scoring so the system clearly surfaces where the plan is tight, overloaded, or under-constrained

- Generate higher-quality outputs: smarter shopping lists, more realistic prep timelines, clearer service plans, and better make-ahead vs day-of decisions

- Better handling of real equipment constraints (oven + stovetop, limited burners, no dishwasher, small kitchen, etc.) so the plan stays executable

- Support progressive refinement — the user can adjust guest count, dietary filters, or equipment and see the plan intelligently update

- Produce a clean, high-quality “Host Decision Packet” that summarizes the plan, stress points, shopping list, prep clock, and service sequence

### Visual Design (High-End)

Transform the current interface into a refined, high-end planning instrument:

- Aesthetic: Luxury editorial meets precise operational tool. Soft warm refined base or deep elegant tones, excellent typography hierarchy, generous purposeful spacing, progressive disclosure

- The planning surface should feel calm, controlled, and premium — not like a form or basic checklist tool

- Controlled route, shopping list, prep clock, and service plan should feel elegant and scannable

- Clear, sophisticated visual language for stress levels, hard stops, and feasibility

- Beautiful empty states, loading states, and a premium printable Host Packet

### Workflow Upgrades

Make the experience smoother and more valuable:

- Create a clearer guided path from initial inputs → plan generation → refinement → final packet

- Allow easy comparison of plan variations (different guest counts or equipment assumptions)

- Make the output immediately useful in the real world — something a host would actually print or reference while preparing

- Keep any connection to Restaurant Intelligence as a clean external handoff only

### Tone & Voice

Keep the precise, honest, slightly dry intelligence voice. Avoid hype, lifestyle fluff, or false certainty. The tool should feel like a sharp, trustworthy planning analyst that respects real kitchen constraints.

Start from the current live application[](https://occasion.saltnotes.blog/) as the baseline. Elevate the intelligence, visual quality, and workflow so Occasion Operating System stands strongly on its own as the host-planning tool. Please complete full GitHub handoff

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4c6f3d05-cda3-4230-a7b9-7a2995de07e5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
