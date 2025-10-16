function New-Migration {
  param(
    [Parameter(Mandatory=$true)][string]$Name
  )
  # Sørg for mappe findes
  if (-not (Test-Path "supabase\migrations")) {
    New-Item -ItemType Directory -Force "supabase\migrations" | Out-Null
  }

  # Unik version: YYYYMMDD_HHMM
  $ts = Get-Date -Format "yyyyMMdd_HHmm"

  # Safe filnavn
  $safe = ($Name -replace "[^a-zA-Z0-9]+","_").ToLower()
  $file = "supabase\migrations\${ts}_${safe}.sql"

  if (Test-Path $file) {
    Write-Host "⚠️ Fil findes allerede: $file" -ForegroundColor Yellow
    return
  }

  # Lidt standard-indhold
  $template = @"
-- Migration: $Name
-- Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

-- Skriv dine ændringer her. Husk idempotens hvor det er muligt:
-- eksempel:
-- create table if not exists public.my_table (...);

-- do $$
-- begin
--   if not exists (select 1 from pg_policies where schemaname='public' and tablename='my_table' and policyname='my_policy') then
--     create policy "my_policy" on public.my_table for select using (true);
--   end if;
-- end $$;

"@

  New-Item -ItemType File -Path $file -Force | Out-Null
  Set-Content -Path $file -Value $template -NoNewline

  Write-Host "✅ Oprettet: $file" -ForegroundColor Green
  Write-Host "Kør derefter:  npx supabase db push" -ForegroundColor DarkGray
}
# Indlæs funktionen (gør dette hver nye terminal-session)
. .\tools\migrations.ps1

# Opret ny migration
New-Migration "weather_hourly_indexes"
# -> supabase\migrations\20251016_2235_weather_hourly_indexes.sql

# Kør den
npx supabase db push
