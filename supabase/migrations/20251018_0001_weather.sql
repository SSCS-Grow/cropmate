-- Robust weather_hourly migration uden hårde afhængigheder

-- (valgfrit men safe hos Supabase)
create extension if not exists pgcrypto;

-- 1) Selve tabellen (uden FK'er til at starte med)
create table if not exists public.weather_hourly (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid null,
  garden_id uuid null,
  ts timestamptz not null,
  temp_c numeric null,
  precip_mm numeric null,
  wind_ms numeric null,
  source jsonb null,
  created_at timestamptz not null default now()
);

-- 2) Unikhed + indeks
create unique index if not exists weather_hourly_garden_ts_uidx
  on public.weather_hourly(garden_id, ts);

create index if not exists weather_hourly_profile_ts_idx
  on public.weather_hourly(profile_id, ts);

-- 3) Tilføj FK'er KUN hvis tabellerne findes
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='profiles'
  ) then
    -- hvis constraint allerede findes, så skip
    if not exists (
      select 1 from pg_constraint where conname = 'weather_hourly_profile_fk'
    ) then
      alter table public.weather_hourly
        add constraint weather_hourly_profile_fk
        foreign key (profile_id) references public.profiles(id) on delete set null;
    end if;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='gardens'
  ) then
    if not exists (
      select 1 from pg_constraint where conname = 'weather_hourly_garden_fk'
    ) then
      alter table public.weather_hourly
        add constraint weather_hourly_garden_fk
        foreign key (garden_id) references public.gardens(id) on delete cascade;
    end if;
  end if;
end $$;

-- 4) RLS policies – gør dem også robuste
alter table public.weather_hourly enable row level security;

-- Basispolicy: ejer via profile_id
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='weather_hourly' and policyname='own weather by profile'
  ) then
    create policy "own weather by profile" on public.weather_hourly
      for all
      using (auth.uid() is not null and profile_id = auth.uid())
      with check (auth.uid() is not null and profile_id = auth.uid());
  end if;
end $$;

-- Ekstra policy: tillad via garden-ejerskab KUN hvis gardens-tabellen findes
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='gardens'
  ) then
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='weather_hourly' and policyname='own weather via garden'
    ) then
      create policy "own weather via garden" on public.weather_hourly
        for all
        using (
          auth.uid() is not null
          and garden_id is not null
          and exists (
            select 1 from public.gardens g
            where g.id = weather_hourly.garden_id
              and g.profile_id = auth.uid()
          )
        )
        with check (
          auth.uid() is not null
          and garden_id is not null
          and exists (
            select 1 from public.gardens g
            where g.id = weather_hourly.garden_id
              and g.profile_id = auth.uid()
          )
        );
    end if;
  end if;
end $$;
