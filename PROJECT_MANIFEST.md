# 🌱 CropMate – Projektmanifest

## 🎯 Mission
CropMate er en webbaseret applikation, der hjælper **haveejere, drivhusejere og små hobbylandbrug**
med at forebygge sygdomme, bekæmpe skadedyr og optimere deres afgrøder gennem **observationer, dataanalyse og AI-rådgivning**.

Målet er at gøre bæredygtig plantepleje **nem, intelligent og moderne** – uanset om brugeren dyrker et enkelt drivhus eller flere små parceller.

---

## 👩‍🌾 Målgrupper
1. **Haveejere** – vil hurtigt kunne identificere sygdomme eller skadedyr i planterne og få forslag til behandling.
2. **Drivhusejere** – ønsker at overvåge klima og sundhed i drivhuset og få automatiske advarsler.
3. **Hobbylandbrug** – vil gerne analysere deres observationer, optimere dyrkningsmetoder og få forbedringsforslag.

---

## 🧩 Hovedfunktioner

### **Core (v0.7–v0.9)**
- Observationer med foto, titel, beskrivelse, GPS og status (draft/approved).
- Analytics-dashboard (grafer, KPI’er, top-lister, CSV-eksport).
- Moderation og admin-panel.
- “Min have” og “Mit drivhus”: opsætning af bede og afgrøder.
- Opgaver: påmindelser om vanding, gødning, beskæring og forebyggelse.

### **Smart AI (v1.0)**
- **Billedgenkendelse (AI Diagnose):**
  Brugeren uploader et foto af en plante → AI analyserer billedet og foreslår mulige sygdomme/skadedyr.
- **ChatGPT-integration:**
  Appen foreslår forbedringer baseret på brugerens data (jordtype, vejr, vækststadie) – fx:
  - Gødningsmængder og blandinger
  - Biologisk skadedyrsbekæmpelse
  - Forebyggende dyrkningsmetoder
- **Automatiske forbedringsforslag:**
  AI lærer af tidligere observationer og viser trends: fx “Din tomatplante får gentagne næringsmangler – prøv at justere gødningsplanen.”

---

## ⚙️ Teknisk stack

| Lag | Teknologi | Bemærkning |
|------|------------|------------|
| Frontend | **Next.js 15 (App Router)** + **TypeScript** + **TailwindCSS / Shadcn UI** | Moderne, hurtig, PWA-klar |
| Backend | **Supabase (Postgres, Auth, Storage)** | API + database + brugerstyring |
| Hosting | **Vercel** | Automatisk CI/CD med previews |
| AI | **OpenAI API (GPT-4o / GPT-5)** | Til tekst og billedgenkendelse |
| CI/CD | **GitHub Actions + Vercel Build** | Inkl. daglig analytics-refresh |
| Overvågning | **Sentry, Supabase logs, Lighthouse** | Fejl, ydeevne og audits |

---

## 🧭 Designprincipper

- **Brugervenlighed først:** Simpelt interface, store klikzoner, mobile-first.
- **Smart men simpelt:** AI skal hjælpe – ikke overtage.
- **Transparens:** Vis altid kilder og skriv “AI-forslag”.
- **Dataetik:** Brugeren ejer sine data og kan altid slette alt.
- **Bæredygtighed:** Biologiske og forebyggende løsninger prioriteres.

---

## 🧩 Datamodel & sikkerhed

### **Observationer (public.observations)**
| Felt | Type | Beskrivelse |
|------|------|-------------|
| id | uuid | Primærnøgle |
| user_id | uuid | Reference til bruger |
| title | text | Observationstitel |
| description | text | Beskrivelse |
| lat/lng | double precision | Lokation |
| photo_url | text | Foto i storage |
| status | text | “draft”, “approved” eller “rejected” |
| created_at | timestamptz | Automatisk |

### **Row Level Security (RLS)**
- **read:** alle kan se `approved`
- **write/update/delete:** kun `auth.uid() = user_id`
- **admin:** rolle med `is_admin = true` kan se alt

### **Storage policies (bucket: observation-photos)**
- **Upload:** kun loggede brugere
- **Læs:** alle, hvis observation er `approved`
- **Slet:** ejer eller admin

---

## 🧠 AI Diagnose Flow (planlagt v0.9–v1.0)

1. **Bruger uploader foto** (via kamera eller fil)
2. App sender foto → `/api/ai/diagnose`
3. Server-side call til OpenAI Vision model
4. Modellen returnerer:
   ```json
   {
     "label": "Bladlus",
     "confidence": 0.94,
     "symptoms": ["krøllede blade", "klistret overflade"],
     "advice": "Brug sæbevand eller nyttedyr (mariehøns)."
   }
## 🔧 Udviklings SOP
### Start daglig kodning
1. `git switch main && git pull`
2. `git switch -c feat/<navn>`
3. `pnpm i`  
4. `pnpm dev`
5. Kør `pnpm lint && pnpm typecheck`
6. Commit: `git add -A && git commit -m "feat: <beskrivelse>"`
7. Push: `git push -u origin feat/<navn>`
8. Test i Vercel Preview før merge.

### Supabase
- Lav SQL i `supabase/migrations/`  
- Test lokalt med `npx supabase start`  
- Push kun via `npx supabase db push --include-all`

---

## 🚀 Roadmap
| Version | Fokus | Status |
|----------|-------|--------|
| v0.7 | Analytics dashboard + eksport | ✅ Aktiv |
| v0.8 | Have/drivhus-modul + opgaver | 🔜 |
| v0.9 | AI diagnose stub + chat UI | 🔜 |
| v1.0 | Full AI-integration, vejledninger & mobil-PWA | 🌱 Planlagt |

---

## 👥 Projektansvarlige
- **Steff S.** – Produktansvarlig og projektleder  
- **ChatGPT (GPT-5)** – Teknisk assistent, arkitekt, dokumentation og kodeoptimering  

hver gang du starter en ny tråd med mig, kan du bare skrive:

“Ny tråd – CropMate (se PROJECT_MANIFEST.md for kontekst).”
---

_Opdateres hver gang større beslutninger træffes._