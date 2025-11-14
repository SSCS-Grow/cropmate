# CropMate – Setup Guide

Denne guide er skrevet til dig der arbejder i VS Code og skal have projektet kørende lokalt, inklusive Supabase og cron-endpoints.

## 1. Forudsætninger

- Node.js 20 LTS
- pnpm eller npm (repoet bruger npm lockfile)
- Supabase CLI (`npm install -g supabase` eller download fra supabase.com)
- VS Code med officielle extensions: ESLint, Prettier, Supabase (valgfri)

## 2. Installér og konfigurer

```bash
npm install
cp .env.example .env.local   # udfyld nøglerne i VS Code
```

Mindst disse variabler skal sættes for lokal udvikling:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (til diagnose)
- `VAPID_*` og `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (push)

Åbn `.env.local` i VS Code (Ctrl+P → `.env.local`) og udfyld værdierne; undgå at commite filen.

## 3. Supabase lokalt

```bash
supabase start
supabase db reset      # hvis du vil have migrations seedet
supabase gen types typescript --linked > src/types/database.types.ts
```

`supabase/config.toml` styrer den lokale instans. Migrations og seed ligger i `supabase/migrations` og `supabase/seed.sql` – hold dem under versionskontrol.

## 4. Udviklingsserver

```bash
npm run dev     # http://localhost:3000
```

Kør tests og statiske checks før commits:

```bash
npm run lint
npm run typecheck
```

## 5. Cron endpoints

- `/api/cron/frost` – kør hver time
- `/api/cron/weather` – kør hver 3. time
- `/api/cron/watering` – kør dagligt kl. 02:30 (Europe/Copenhagen)

Alle cron-ruter forventer `CRON_SECRET` i headeren `authorization: Bearer <secret>`.

## 6. Storage buckets

- `hazard-photos` – observationer (public)
- `diagnose-uploads` – diagnosefotos (signed URLs)

Policies ligger i Supabase dashboardet; dokumentér ændringer i `supabase/policies.md` (opret fil hvis den ikke findes).

## 7. Deploy flow

1. Commit og push til GitHub.
2. Vercel bygger automatisk preview eller production branch.
3. Tjek Sentry + Vercel logs før du promoverer til production.

## 8. VS Code tips

- Brug “Terminal: Create New Integrated Terminal” for at holde supabase og `npm run dev` kørende side om side.
- `Ctrl+Shift+P → Tasks: Run Task → dev` kan sættes op til at starte både Supabase og Next.
- Sørg for at ESLint/Prettier extensions er sat til “Format on Save”, så vi holder samme stil.

## 9. Observability (Sentry)

Sentry er allerede wired til Next.js (client/server/edge). Sæt disse variabler i .env.local og i Vercel:

- SENTRY_DSN – privat DSN til server/edge
- NEXT_PUBLIC_SENTRY_DSN – samme DSN til browseren
- SENTRY_ENVIRONMENT – fx local, preview, production`n- SENTRY_AUTH_TOKEN – bruges ved build til at uploade sourcemaps
- SENTRY_ORG og SENTRY_PROJECT – matcher projekt-navn i sentry.io

På Vercel skal SENTRY_AUTH_TOKEN, SENTRY_ORG og SENTRY_PROJECT være markeret som **Encrypted** env vars, ellers uploader buildet ikke sourcemaps og du mister stacktraces. Lokalt kan du lade dem stå tomme, hvis du ikke vil uploade sourcemaps.

