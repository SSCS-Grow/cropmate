This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# cropmate
# cropmate


# 🌱 CropMate (MVP)

Et open-source værktøj til haveejere og dyrkere, der kombinerer **vejrintegration, opgaver, kort og observationer** – bygget med Next.js + Supabase.

---

## 🚀 Features
- **Dashboard**: vejr (timeout-sikret), opgaver & alerts
- **Katalog**: crops + detaljer
- **Min have**: personlig samling
- **Hazard-kort**: clustering, heatmap, drop nål, foto-upload, CSV-eksport, “min placering”, “følg mig”
- **Moderation**: flag/skjul, admin-panel, global moderation side
- **Cron jobs**: frost-check + vanding (ET₀)

---

## 📂 Repo struktur
- `/src/` → Next.js app
- `/db/sql/` → database schema, policies, seeds, indexes
- `/docs/` → setup, arkitektur, roadmap
- `.env.example` → miljøvariabler (uden hemmeligheder)

---

## 📖 Dokumentation
- [SETUP.md](docs/SETUP.md) – opsætning & deploy
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) – arkitektur & nøglefiler
- [ROADMAP.md](docs/ROADMAP.md) – næste skridt

---

## 🛠️ Tech stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Auth, DB, Storage)
- Vercel (hosting & cron jobs)

---

## 🔑 Miljøvariabler
```bash
NEXT_PUBLIC_APP_NAME=CropMate
NEXT_PUBLIC_SUPABASE_URL=YOUR_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_KEY


🚀 Projekt-workflow (v0.6)

Denne sektion beskriver vores build- og release-flow for CropMate v0.6.

✅ CI (GitHub Actions)

Kører automatisk på push til main og Pull Requests.

Trin:

Install → npm ci

Typecheck → npm run typecheck (fallback til tsc --noEmit)

Build → npm run build (Next.js 15 + Turbopack)

Filer:

.github/workflows/ci.yml (typecheck + build)

.github/workflows/vercel-preview.yml (valgfrit – kun hvis vi ikke bruger Vercel GitHub-appen)

Secrets (GitHub → Settings → Secrets and variables → Actions → New repository secret):

NEXT_PUBLIC_SITE_URL

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

(valgfri server-keys hvis build kræver dem)

CI-workflow’et skriver evt. secrets til .env under build. Fjern linjer du ikke har brug for.

🔍 Vercel Preview (PRs)

Anbefalet: brug Vercel GitHub App → auto-previews på alle PRs (ingen ekstra YAML nødvendig).
Alternativ (CLI-styret): brug .github/workflows/vercel-preview.yml og sæt disse secrets:

VERCEL_TOKEN

VERCEL_ORG_ID

VERCEL_PROJECT_ID

Workflow’et:

bygger projektet

kører vercel pull for preview-envs

deployer prebuilt og kommenterer preview-URL tilbage på PR

Tip: Med Vercel-appen får du auto-kommentarer med preview-link uden ekstra konfiguration.

🧭 Opret v0.6-issues (GitHub CLI)

Vi bruger et script til at oprette milestone + labels + 1 tracking-issue + 7 under-issues (A–G).

PowerShell (Windows)

Installer GitHub CLI:

winget install --id GitHub.cli


Log ind:

gh auth login


Tillad scripts (første gang):

Set-ExecutionPolicy RemoteSigned -Scope CurrentUser


Kør scriptet i repo-roden:

.\create-issues.ps1


Scriptet:

opretter milestone v0.6 (idempotent)

opretter labels (frontend, backend, supabase, admin, ui-ux, pwa, priority:high, tracking)

opretter alle issues med tjeklister og knytter dem til v0.6

Alternativ til Windows: brug create-issues.sh i Bash (Git Bash/WSL/macOS/Linux).

💻 Lokal udvikling (quickstart)
# Installer
npm ci

# Kør lokalt
npm run dev

# Typecheck
npm run typecheck

# Build (prod)
npm run build


Krævede env-vars (min.):
NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
→ læg dem i .env.local ved lokal kørsel.

🧪 PR-flow (kort)

Opret feature-branch

Commit & push → åben PR

CI kører typecheck + build

Vercel Preview kommenterer preview-URL på PR

Code review → merge til main

Tagging til release: v0.6.0-beta → v0.6.0-stable

🛠️ Fejl & fejlsøgning

gh: command not found → installer GitHub CLI (winget install --id GitHub.cli) og åbne terminal igen.

PowerShell blokerer .ps1 → kør Set-ExecutionPolicy RemoteSigned -Scope CurrentUser.

Vercel Preview mangler → brug Vercel GitHub App eller sæt VERCEL_* secrets og aktiver vercel-preview.yml.

Build fejler pga. envs → tjek at CI-secrets matcher de env-vars, build’en forventer.

Type errors → kør lokalt npm run typecheck og fiks før PR.

📦 Versionsstrategi

v0.6.0-beta (feature-freeze + bugfixes)

v0.6.0-stable (merge af testede fixes + final tag)

Patch-releases: v0.6.x for hotfixes