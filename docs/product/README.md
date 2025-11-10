# CropMate – Produktretning & MVP-spec (EU/Skandinavien)

> Denne fil er den autoritative kilde for retning, scope og Definition of Done.
> Opdateres løbende – linkes i PR-skabelon og issue-templates.

1) Vision & mål

Vision: Gøre hverdagen lettere for haveejere, drivhusejere og hobbylandbrugere i Skandinavien/EU ved at give personlige råd, simple værktøjer og tidlige advarsler – så de dyrker mere, bedre og sundere.

Mål (12 mdr.):

50k MAU, 30% 4-ugers retention, NPS ≥ 45.

60% af aktive brugere registrerer mindst 3 afgrøder.

40% reagerer på mindst én vejr-/frost-/sygdoms-advarsel pr. sæson.

Kerneværdi for brugeren:

Personlige dyrkningsråd (“hvad gør jeg nu og næste?”)

Tidlige advarsler (frost/tørke/regn/varme + lokale sygdomsrisici)

Enkel registrering af afgrøder og opgaver

2) Primære målgrupper

Haveejeren (nybegynder → let øvet): 5–30 afgrøder, søger enkle råd.

Drivhusejeren: Temperaturfølsom dyrkning; værdi af præcise advarsler.

Hobbylandbrugeren: Flere bedarealer, ønsker planlægning og log.

Sprog/region: Dansk, svensk, norsk (fase 1); tysk/engelsk (fase 2). EU-wide vejr og zoner.

3) Jobs-to-be-done (JTBD)

Når jeg tilføjer en ny afgrøde, vil jeg hurtigt forstå hvordan og hvornår jeg skal så, vande, gøde og beskytte den – uden at læse lange guides.

Når vejret ændrer sig, vil jeg få en klar notifikation (frost/tørke/regn/varme) med én anbefalet handling.

Når jeg ser tegn på sygdom/skadedyr, vil jeg få en simpel diagnose og to handlingsspor: naturligt/økologisk eller kemisk (med sikkerhed og regler).

4) MVP – funktioner (scope)

4.1 Afgrøder ("Min have")

Opret/ret/slet afgrøder (kultur, sort, placering/bed, sådato, plantetidspunkt).

Auto-foreslå opgaver (vanding, udplantning, gødning, beskæring) baseret på dyrkningskalender + lokale vejrdata.

Hurtige check-ins: “Udført”, “Udsæt til”, “Spring over”.

4.2 Dyrkningsvejledninger

Kort, sammenfattet guide pr. kultur med næste-skridt-kort.

Valg: Naturlig/økologisk vs kemisk bekæmpelse – med tydelige etik/piktogrammer.

4.3 Vejr & advarsler (EU/Skandinavien)

Lokalt vejr (næste 7 dage), samt advarsler: frost, tørke, kraftig regn, hedebølge.

Notifikationer (PWA push) + handling (“Dæk planter i nat”).

4.4 Sygdom/Skadedyr – V1

Hurtig diagnoseformular: foto + symptomer + kultur.

Resultat: 2–3 sandsynlige bud + anbefalede handlinger (økologisk/kemisk).

4.5 Katalog (bibliotek)

Søgbart bibliotek over skadedyr/sygdomme/kulturer.

4.6 Kort (valgfri i MVP hvis tid)

Observationer i nærområdet (heatmap + clustering). Kan flyttes til v1.1.

Non-goals i MVP: Community-kommentarer, avanceret planlægning/rotation, markedsplads.

5) Informationsarkitektur & navigation

Hjem (Dashboard): Dagens vejrbid + “Næste skridt” for dine afgrøder.

Min Have: Liste + detalje for afgrøder; tilføj ny.

Vejr: 7-dages udsigt + advarsler + anbefalet handling.

Diagnose: Upload foto → få svar.

Bibliotek: Guides og opslagsværk.

Profil: Region, sprog, øko/kemisk præference, notifikationer.

Mobil: Bottom tab bar (Hjem, Min Have, Diagnose, Vejr, Mere).

6) UX-principper (designsystem)

Én handling pr. skærm (primær CTA).

Kort tekst, store knapper, 44px mål.

Tomtilstande med “næste skridt”.

Progressive disclosures (fold ud/“vis mere”).

Tilgængelighed: WCAG AA; synlige fokus-ringe; god kontrast.

Komponenter: PageHeader, Card, ListItem, EmptyState, TaskChip, WeatherAlert.

7) Data & teknisk arkitektur (oversigt)

Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui, lucide-react.

Supabase: Auth (RLS), Postgres (afgrøder, opgaver, observationer), Storage (fotos).

Vejr: ekstern API (EU-dækning) + cron for alarmer; cache på edge.

AI-diagnose: Edge function (OpenAI Vision el. custom), rate limiting, audit log.

PWA: Manifest, SW, offline cache, push.

Nøgletabeller (minimum):

profiles, user_plants, plant_tasks, diagnoses, library_items, observations, alerts.

RLS: brugerspecifikke data (user_id). library_items er public.

8) Regulatorisk (EU)

GDPR: privatlivspolitik, databehandleraftale (Supabase), samtykke til notifikationer.

Kemiske råd: tydelige disclaimers + henvisning til national lovgivning/etiketter.

9) Succes-metrics (MVP)

A1: 70% gennemfører onboarding og tilføjer mindst 1 afgrøde første session.

A2: ≥50% klikker “Udfør” på mindst 1 opgave første uge.

A3: ≥35% aktiverer push-notifikationer.

A4: ≥20% bruger diagnose mindst én gang første måned.

10) Roadmap (8 uger → Public Beta)

Uge 1–2 (Alignment & UX):

Wireframes for IA + flows (Hjem, Min Have, Diagnose, Vejr, Bibliotek).

Design tokens; komponenter: PageHeader, Card, EmptyState, WeatherAlert.

Implementér onboarding (region/sprog/præferencer), “Tilføj første afgrøde”.

Uge 3–4 (Kernefunktionalitet):

Min Have CRUD + autoopgaver (regler pr. kultur).

Vejrside + advarsler (cron + push).

Bibliotek integreret i kultur- og diagnoseflow.

Uge 5 (Diagnose V1):

Upload + prompt + svarliste med handlinger (økologisk/kemisk).

Logging, rate limit, sikkerhed.

Uge 6 (PWA & Performance):

Push, offline, image opt., dynamic imports, Lighthouse ≥ 90.

Uge 7 (QA & A11y):

Playwright smoke, Sentry nul-fejl, a11y fixes, tomtilstande & skeletons.

Uge 8 (Beta):

Beta release, feedback-indsamling i app, post-hotfixes.

11) Definition of Done (release-klar)

P0=0, P1≤3; Lighthouse Mobile ≥90 (/, /min-have, /vejret, /diagnose).

Onboarding-flow gennemført på <3 min.

Push-notifikationer virker for frost/tørke/regn/varme.

Diagnose returnerer svar <6 sekunder (p95) og mindst 2 forslag.

GDPR-tekst, cookie-banner, TOS i footer; Sentry uden unhandled exceptions.

12) Næste konkrete leverancer (klar til implementering)

Onboarding flow (3 trin): Region/sprog → præference (økologisk/kemisk) → Tilføj første afgrøde.

Hjem/Dashboard v2: “Næste skridt i dag” + dagens vejrkort + 1 klik for at udføre/udsætte.

Vejr-advarsler: cron + push + handlingskort (dæk, vande, ventilér, gøde).

Diagnose V1: upload → 2–3 forslag → handlinger + links til bibliotek.

UI-polish: tokens, kortvisninger, tomtilstande, fokus/a11y, performance.

13) Risici & afbødning

Data-kvalitet (vejret/diagnoser): cache + kilder + “usikkerhed” visning.

Kompleksitet for nybegyndere: progressive disclosures + defaults.

Regler for kemi: tydelige disclaimers + landespecifik info.

14) Bilag – Eksempler på microcopy

Tom Min Have: “Ingen afgrøder endnu – tilføj din første på 30 sekunder.”

Vejr-alarm (frost): “Frost i nat (-3°C). Dæk dine kartofler før kl. 20.”

Diagnose tom: “Tag et klart foto i dagslys. Vis symptomet tæt på bladet.”

**Seneste opdatering:** 2. nov 2025  
**Redaktør:** @SSCS-Grow

> Se også: docs/product/changelog.md
