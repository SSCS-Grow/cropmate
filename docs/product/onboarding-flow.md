# Onboarding Flow – CropMate

Denne note beskriver præcist, hvad onboarding skal gøre (data, UX, API) før vi bygger den.

## 1. Formål

- Sikre at alle nye brugere får sat **region/sprog**, **dyrkningspræference** og **mindst én afgrøde** fra start, så dashboard/opgaver giver mening.
- Gemme valgene centralt (Supabase) og markere profilen som "onboarded", så vi kan gate resten af appen.
- Måles på KPI’er A1/A2 fra produktplanen (70 % gennemfører onboarding + første opgave).

## 2. Flow (3 trin)

1. **Region & Sprog**
   - Vælg land/region (liste over EU/Skandinavien); vi mapper til ISO-landekode.
   - Vælg app-sprog (da/sv/no/en – vi gemmer som locale string).
2. **Dyrkningsstil**
   - Vælg præference: `eco_only`, `eco_first`, `balanced`, `allows_chemical` (visuelt radio cards).
   - Brugeren kan også slå “modtag kemiske anbefalinger” til/fra.
3. **Første afgrøde**
   - Autocomplete/søg i `crops` tabellen og tilføj én afgrøde til `user_crops` (kun kultur og evt. plantedato).
   - Når afgrøden er gemt oprettes auto-opgaver som normalt (vi genbruger eksisterende generator).

CTA’er: “Fortsæt” pr. trin, disable når data mangler. Vi viser statusbar (trin 1/3 osv.).

## 3. Data / Supabase

Vi udvider `profiles` tabellen med:

| Kolonne          | Type      | Beskrivelse                                  |
| ---------------- | --------- | -------------------------------------------- |
| `region_code`    | text      | ISO 3166-1 alpha-2 (fx `DK`, `SE`, `DE`)      |
| `language`       | text      | Allerede findes – vi bruger locale (`da-DK`) |
| `growing_style`  | text      | Enum-lignende tekst (eco_only / balanced …)  |
| `onboarded_at`   | timestamptz | Sættes når trin 3 er færdigt              |

Derudover:

- Vi opdaterer/indsætter i `alert_prefs.locale` samme locale som valgt sprog.
- Første afgrøde = insert i `user_crops (user_id, crop_id, planted_on)`.

## 4. Gating / Redirects

- Middleware checker på hver request (undtagen `/onboarding`, `/api`, statiske filer) om bruger er logget ind men har `profiles.onboarded_at IS NULL`. Hvis ja → redirect til `/onboarding?next=<path>`.
- Når onboarding er succesfuld, sætter vi `onboarded_at = now()` og redirecter til `next` (fallback `/dashboard`).

## 5. Implementation notes

- Onboarding UI bliver client component i `src/app/onboarding/page.tsx` (bruger `useAuthSession` + Supabase browser client).
- Tilgængelighed: store knapper, keyboard navigation, progress indicator med ARIA.
- Error states: toast/inline besked hvis Supabase insert fejler; disabled state mens der gemmes.
- Track eventer (PostHog) senere, men vi laver `data-step` hooks til instrumentation.

## 6. Definition of done

- Ny bruger logges ind → redirect til `/onboarding` → gennemfører på < 3 min → lander på `/dashboard` med første afgrøde i “Min have”.
- Eksisterende brugere uden `onboarded_at` får flowet næste gang de besøger appen.
- `npm run lint` og `npm run typecheck` kører grønt efter ændringerne.
- Dokumentation: opdater `docs/product/vision-plan.md` + `docs/SETUP.md` med onboarding note (efter implementering).
