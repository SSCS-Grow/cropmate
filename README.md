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
