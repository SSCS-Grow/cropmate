# Contributing

## Branch- og PR-regler
- Branch: feature/*, fix/*, chore/*
- PR: Skal linke til relevant sektion i docs/product/README.md (scope alignment)
- Krav før merge: Lint + typecheck + tests + Lighthouse CI (90+/90+/90+)

## Kode-standard
- TS strict, ESLint + Prettier
- Kun lucide-react ikoner, shadcn/ui komponenter
- Ingen console.errors i prod

## Mappestruktur (src/)
- app/ (Next App Router)
- components/ui/ (genbrugelige UI)
- modules/ (feature-moduler: garden, weather, diagnose, library, alerts)
- lib/ (helpers, api-klienter)
- types/ (supabase genererede typer m.m.)
