# CropMate Vision & Delivery Plan

Denne fil samler den nuværende status, den overordnede vision og den hårdningsplan vi følger frem mod public beta og v1.0. Den er baseret på samtalerne i november 2025 og opdateres løbende, så vi begge har samme reference uanset hvilken VS Code-session eller Codex-tråd der kører.

## 0. Snapshot (november 2025)

- **Repo:** `github.com/SSCS-Grow/cropmate`
- **Prod deploy:** `https://cropmate-five.vercel.app`
- **Stack:** Next.js 15 (App Router, Turbopack), TypeScript, Tailwind/shadcn, Supabase (Auth/DB/Storage), Leaflet, Vercel Cron, OpenAI (diagnose), PostHog/Plausible, Sentry
- **Status 13. nov:** Onboarding flow (3 trin) er implementeret med redirect + gate i middleware, Diagnose V1 har nyt UI med hurtige handlinger, og push-varsler (frost/vand) + CTA er klar.

## 1. Leverancefaser

| Fase | Scope | Status | Noter |
| --- | --- | --- | --- |
| 1. Grundstruktur | Next.js setup, Supabase helpers, storage buckets, CI/CD | Færdig | App Router-layout, auth-klienter og buckets er på plads |
| 2. Dashboard & værktøjer | Dashboard, opgaver, alerts, cron-jobs | Færdig | Data vises, men realtime kan forbedres |
| 3. Library | Offentligt bibliotek + admin CRUD | Færdig | Søgning, detaljer og reindex-job virker |
| 4. Hazard-kort | Leaflet heatmap, rapporter, moderation | Færdig | Observationer med upload og eksport |
| 5. Min have | Brugerens planter, auto-opgaver | Færdig | Liste, filtre, bulk-opgavegenerator |
| 6. PWA & mobil | Manifest, SW, push, offline | Delvist | SW og push-API er startet, men ikke fuldt testet |
| 7. Diagnose & AI | Diagnoseformular, edge-funktion, svarvisning | I gang | Formular findes, men AI-flow og UI mangler finish |
| 8. Polish & release | Onboarding, GDPR/TOS, SEO, QA | Mangler | Ingen onboarding, cookie-banner eller beta-checklist endnu |
| 9. Public beta | Staging, tests, mobil QA | Mangler | Afhænger af fase 6-8 |

## 2. Kritiske mangler før public beta

1. **PWA og push** – offline-cache, push fra cron (frost/tørke/regn/varme) og fuld test på iOS/Android.
2. **Diagnose V1** – edge-funktion + UI skal levere forslag (økologisk/kemisk) < 6 sekunder.
3. **Onboarding** – 3 trin: region/sprog → dyrkningspræference → tilføj første afgrøde.
4. **GDPR/TOS** – cookie-banner, privacy og vilkår i footer; Supabase databehandler noteret.
5. **Stabilitet** – Sentry uden unhandled errors, Playwright smoke, Lighthouse mobil ≥ 90.

## 3. Stabilization sprint (7 dage, feature freeze)

**Regler:** Ingen nye features; kun bugfix, UX-polish og performance. Arbejd i `release/hardening-v0.9`.

### Dag 1-2
- Aktivér Sentry (client/server/edge) og PostHog/Plausible events for de tre kerneflows.
- Opsæt CI for `npm run lint`, `npm run typecheck`, Lighthouse CI og Playwright smoke.

### Dag 3-5
- Polér UX: konsistent typografi/spacing, tomtilstande med “næste skridt”, skeletons.
- Gennemfør WCAG AA: fokus-ringe, labels, kontrast.
- Mobil: sticky CTA, safe-areas, maks. fem hovedfaner (Hjem, Min Have, Diagnose, Vejr, Mere).

### Dag 6
- Performance: alle kritiske sider < 2 sekunder TTI på throttled 4G.
- Lazy-load Leaflet/heatmap, brug `next/image`, minimer bundle-størrelser.

### Dag 7
- Go/No-Go review: P0 = 0, P1 ≤ 3, seneste 48 timer uden nye Sentry-fejl, alle tjeklister grønne.

## 4. Testplan (acceptance-kriterier)

### Smoke flows
- Login → dashboard (redirect < 2 s).
- Library søgning og detalje uden layout-hop.
- Min Have: tilføj, se, slet plante (optimistic UI).
- Kort: upload observation med geo og foto; ses i moderation og eksport.
- Eksport: CSV matcher filtrerede kolonner og encoding.
- Cron: frost-job skriver alert der vises i dashboard.

### UX/a11y
- Ens knapper (primær/sekundær/ghost), PageHeader og Toolbar-komponenter.
- Alle formularer har labels; tomtilstande beskriver næste skridt.
- Ingen konsolfejl i prod; loading.tsx/skeletons på alle ruter med async data.

### Performance
- Lighthouse (mobile) ≥ 90 for `/`, `/dashboard`, `/library`, `/map`.
- Billeder lazy-loades og har faste dimensioner.
- Ingen gigantiske vendor-chunks; dynamic imports for tunge komponenter.

## 5. Klar til beta checklist

- [ ] P0 = 0 og P1 ≤ 3 issues.
- [ ] Playwright smoke + Lighthouse CI grøn i GitHub Actions.
- [ ] Onboarding flow (< 3 minutter) med auto-opgaver bagefter.
- [ ] Diagnose edge-route leverer svar < 6 sekunder (p95) med mindst to forslag.
- [ ] Push-notifikationer leverer frost/tørke/regn/varme-hændelser.
- [ ] GDPR-tekst, cookie-banner og TOS i footer.

## 6. Produktvision og principper (kort version)

- Webapp til haveejere, drivhusejere og hobbylandbrugere i Skandinavien/EU.
- Brugeren registrerer afgrøder, får konkrete råd (dyrkningsvejledning, gødning, sygdomsbekæmpelse øko/kemisk).
- Lokalt vejr, alerts og handlinger er kernedelen; appen skal være ekstremt enkel.
- UX-principper: én primær handling pr. skærm, korte tekster, store touch-mål, tomtilstande med guidance, WCAG AA.
- Fokusfaner: Hjem, Min Have, Diagnose, Vejr, Mere.

## 7. Næste leverancer (klar til at implementere)

1. Onboarding flow (region/sprog → øko/kemisk → tilføj første afgrøde).
2. Dashboard v2 (“Næste skridt i dag”, vejralarmkort, 1‑klik udfør/udsæt).
3. Diagnose V1 (upload → 2-3 forslag → handlinger + links til bibliotek).
4. Vejr-advarsler end-to-end (cron + push + handlingskort).
5. UI-polish (tokens, kortvisning, tomtilstande, fokus/a11y, performance).

## 8. Beslutninger & aftaler

- Hele planen ligger i repo (denne fil + `docs/product/README.md`), så nye tråde altid kan henvise hertil.
- VS Code er den primære editor; alle instruktioner skrives, så de kan følges dér.
- Ryddes op i repoet: backupfiler fjernes, `.env.example` holdes ajour, Supabase-artefakter (migrations, typer) bliver under versionskontrol.

_Sidst opdateret: 13. november 2025_
