# CropMate – Architecture Overview

## Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind
- Supabase (Auth/DB/Storage)

## Key Paths
- `src/app/dashboard/page.tsx` – vejr, tasks, alerts
- `src/app/crops/*` – katalog + detaljer
- `src/app/my/page.tsx` – "Min have"
- `src/app/hazards/[id]/page.tsx` – kort + moderation
- `src/components/HazardReportsMap.tsx` (+ .client.tsx) – kortlag, heatmap, upload, flag/skjul
- `src/components/AdminBadge.tsx`, `src/components/AdminNavLink.tsx`
- `src/app/admin/moderation/page.tsx` – global moderation

## API routes
- `/api/cron/frost`
- `/api/cron/watering`

## DB (nøgle-tabeller)
- `profiles`, `crops`, `user_crops`, `tasks`, `alerts`, `hazard_reports`

## RLS princip
- Bruger ser kun egne rækker
- Public read for katalog
