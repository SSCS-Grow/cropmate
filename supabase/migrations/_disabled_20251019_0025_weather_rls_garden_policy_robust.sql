-- Robust RLS for weather_hourly: drop old garden policy if any, then create conditionally

-- Enable RLS (safe if already enabled)
alter table public.weather_hourly enable row level security;

-- 1) Drop den gamle policy hvis den eksisterer (for at undgå conflicts)
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='weather_hourly' and policyname='own weather via garden'
  ) then
    drop policy "own weather via garden" on public.weather_hourly;
  end if;
end $$;

-- 2) Basispolicy: via profile_id på selve weather_hourly (beholdes)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='weather_hourly' and policyname='own weather by profile'
  ) then
    create policy "own weather by profile" on public.weather_hourly
      for all
      using (auth.uid() is not null and profile_id = auth.uid())
      with check (auth.uid() is not null and profile_id = auth.uid());
  end if;
end $$;

-- 3) (Valgfrit) Ekstra: via ejerskab af garden — men KUN hvis kolonnen findes
do $$
declare
  has_gardens boolean;
  has_profile_id boolean;
  has_user_id boolean;
  has_owner_id boolean;
begin
  select exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='gardens'
  ) into has_gardens;

  if not has_gardens then
    -- Ingen gardens-tabel -> ingen ekstra policy nødvendig
    return;
  end if;

  -- Tjek hvilke mulige ejer-kolonner der findes på gardens
  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='gardens' and column_name='profile_id'
  ) into has_profile_id;

  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='gardens' and column_name='user_id'
  ) into has_user_id;

  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='gardens' and column_name='owner_id'
  ) into has_owner_id;

  -- Opret kun én af varianterne – i prioriteret rækkefølge
  if has_profile_id then
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
  elsif has_user_id then
    create policy "own weather via garden" on public.weather_hourly
      for all
      using (
        auth.uid() is not null
        and garden_id is not null
        and exists (
          select 1 from public.gardens g
          where g.id = weather_hourly.garden_id
            and g.user_id = auth.uid()
        )
      )
      with check (
        auth.uid() is not null
        and garden_id is not null
        and exists (
          select 1 from public.gardens g
          where g.id = weather_hourly.garden_id
            and g.user_id = auth.uid()
        )
      );
  elsif has_owner_id then
    create policy "own weather via garden" on public.weather_hourly
      for all
      using (
        auth.uid() is not null
        and garden_id is not null
        and exists (
          select 1 from public.gardens g
          where g.id = weather_hourly.garden_id
            and g.owner_id = auth.uid()
        )
      )
      with check (
        auth.uid() is not null
        and garden_id is not null
        and exists (
          select 1 from public.gardens g
          where g.id = weather_hourly.garden_id
            and g.owner_id = auth.uid()
        )
      );
  else
    -- Ingen kendte ejer-kolonner – så springer vi ekstra policy over.
    -- Basispolicy via weather_hourly.profile_id er stadig aktiv.
    perform 1;
  end if;
end $$;
