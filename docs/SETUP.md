# CropMate – Setup Guide

## Framework & Deploy
- Framework: Next.js 15 (App Router)
- Node: auto på Vercel
- Build: `next build` (default)

## Env vars
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Cron jobs
- `/api/cron/frost` – kører hver time
- `/api/cron/watering` – kører dagligt kl. 02:30 (Europe/Copenhagen)

## Storage
- Bucket: `hazard-photos` (public)

## Deploy flow
- Git push → Vercel build → Preview/Prod
