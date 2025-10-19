# CropMate v0.6 Issue Setup Script (PowerShell version)
# ------------------------------------------------------
# Kør i VS Code terminal eller PowerShell-vindue efter du har logget ind med: gh auth login

Write-Host "🔐 Tjekker GitHub login..." -ForegroundColor Cyan
gh auth status | Out-Null

$Milestone = "v0.6"
$Repo = "."

Write-Host "🏷️  Opretter milestone (hvis den ikke findes): $Milestone"
try {
    gh api -X POST repos/:owner/:repo/milestones -f title="$Milestone" | Out-Null
} catch {}

# Labels
Write-Host "🏷️  Opretter labels..."
$labels = @(
    @{ name="tracking"; color="5319e7"; desc="Tracking issue" },
    @{ name="enhancement"; color="a2eeef"; desc="Feature forbedring" },
    @{ name="frontend"; color="c2e0c6"; desc="UI/UX/klient" },
    @{ name="backend"; color="fef2c0"; desc="API/Server" },
    @{ name="supabase"; color="5319e7"; desc="Database/Storage/Auth" },
    @{ name="admin"; color="f9d0c4"; desc="Admin/Moderation" },
    @{ name="ui-ux"; color="c5def5"; desc="Design/UX" },
    @{ name="pwa"; color="bfdadc"; desc="PWA/Offline" },
    @{ name="priority:high"; color="d93f0b"; desc="Høj prioritet" }
)
foreach ($l in $labels) {
    gh label create $l.name --color $l.color --description $l.desc --force | Out-Null
}

# Hovedissue
Write-Host "🧭 Opretter tracking issue..."
$mainBody = @"
## CropMate v0.6 Roadmap (tracking issue)

**Mål:** Bygge videre på v0.5 med fokus på data, UX og admin-funktioner.

### Underprojekter
- [ ] A. Data & API
- [ ] B. Min Have 2.0
- [ ] C. Skadedyr & Sygdomsbibliotek
- [ ] D. Observationer (Hazards)
- [ ] E. Moderation & Admin
- [ ] F. UI/UX & Performance
- [ ] G. Deployment & QA
"@
gh issue create -R $Repo --title "v0.6 – Core roadmap tracking" --label tracking --milestone $Milestone --body $mainBody | Out-Null

function New-Issue($title, $labels, $body) {
    gh issue create -R $Repo --title $title --label enhancement $labels --milestone $Milestone --body $body | Out-Null
    Write-Host "   → $title" -ForegroundColor Green
}

Write-Host "📦 Opretter under-issues..." -ForegroundColor Cyan

# A
New-Issue "A. Data & API" "--label backend --label supabase --label priority:high" @"
### A. Data & API

**Mål:** Forbedre Supabase-datamodel, API-endpoints og sikkerhed.

#### Opgaver
- [ ] Gennemgå 'pests', 'diseases', 'observations', 'gardens', 'profiles'
- [ ] Tilføj relations (FK) + cascading delete
- [ ] Typed API endpoints (/app/api/.../route.ts)
- [ ] Rate limiting + logging middleware
- [ ] Opdater schema-dokumentation i README.md
"@

# B
New-Issue "B. Min Have 2.0" "--label frontend --label ui-ux" @"
### B. Min Have 2.0

**Mål:** Redesign & bedre UX for personlig haveoversigt.

#### Opgaver
- [ ] Ny grid-visning af afgrøder
- [ ] Noter/logbog pr. plante
- [ ] Realtidssync via Supabase subscriptions
- [ ] Hurtig adgang til observationer
"@

# C
New-Issue "C. Skadedyr & Sygdomsbibliotek" "--label frontend --label ui-ux --label supabase" @"
### C. Skadedyr & Sygdomsbibliotek

**Mål:** Hurtigere søgning + stærkere admin-flow.

#### Opgaver
- [ ] Detailfaner (Info | Billeder | Bekæmpelse)
- [ ] Hurtig søgning (debounce + client-cache)
- [ ] Admin: billedupload + godkend direkte i UI
- [ ] Stub til AI-identifikation (v0.7 forberedelse)
"@

# D
New-Issue "D. Observationer (Hazards)" "--label frontend --label backend --label supabase --label priority:high" @"
### D. Observationer (Hazards)

**Mål:** Lettere rapportering med billeder og lokation.

#### Opgaver
- [ ] Foto-uploader m. komprimering & preview
- [ ] Lokationsvalg via kort + reverse geocoding
- [ ] Redigér/slet egne observationer
- [ ] Filtre i kort (dato, type, status)
"@

# E
New-Issue "E. Moderation & Admin" "--label admin --label backend --label frontend --label priority:high" @"
### E. Moderation & Admin

**Mål:** Samlet admin-dashboard.

#### Opgaver
- [ ] /admin oversigt (rapporter, flag, skjulte items, brugere)
- [ ] Godkend/Skjul/Slet direkte fra tabeller
- [ ] Roller (admin, bruger, moderator)
- [ ] Email-notifikationer ved nye rapporter/flag
"@

# F
New-Issue "F. UI/UX & Performance" "--label frontend --label ui-ux" @"
### F. UI/UX & Performance

**Mål:** Glattere oplevelse og hurtigere load.

#### Opgaver
- [ ] Opdater Tailwind + tema (lys/mørk)
- [ ] Framer Motion transitions
- [ ] Lazy loading af billeder/komponenter
- [ ] Globale loading/error-boundaries
"@

# G
New-Issue "G. Deployment & QA" "--label backend" @"
### G. Deployment & QA

**Mål:** Stabil release-flow.

#### Opgaver
- [ ] GitHub Actions: CI build + typecheck
- [ ] Preview deploys for PRs (Vercel)
- [ ] Sikkerhedstjek: ENV, public keys, rate limits
- [ ] Versiontag: v0.6.0-beta → v0.6.0-stable
"@

Write-Host "`n✅ Alle issues oprettet under milestone '$Milestone'!" -ForegroundColor Yellow
