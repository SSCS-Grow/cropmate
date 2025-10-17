-- v0.6 fix: robust owner policy for weather_hourly
-- Finder automatisk ejer-kolonnen på public.gardens blandt ('profile_id','user_id','owner_id')

-- Sikr tabellen findes før vi piller ved den
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='weather_hourly'
  ) then
    raise notice 'weather_hourly ikke fundet - skipper policy migration';
    return;
  end if;
end $$;

-- Slå RLS til, hvis ikke allerede
alter table public.weather_hourly enable row level security;

-- Drop eksisterende policy med samme navn (hvis den findes)
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='weather_hourly' and policyname='own weather via garden') then
    drop policy "own weather via garden" on public.weather_hourly;
  end if;
end $$;

-- Opret dynamisk policy baseret på ejer-kolonnen i gardens
do $$
declare
  owner_col text;
  sql text;
begin
  select column_name
  into owner_col
  from information_schema.columns
  where table_schema='public' and table_name='gardens'
    and column_name in ('profile_id','user_id','owner_id')
  order by case column_name
             when 'profile_id' then 1
             when 'user_id'   then 2
             when 'owner_id'  then 3
             else 4
           end
  limit 1;

  if owner_col is null then
    raise notice 'Ingen ejer-kolonne fundet på gardens; skipper owner-baseret policy.';
    return;
  end if;

  sql := format($f$
    create policy "own weather via garden" on public.weather_hourly
      for all
      using (
        auth.uid() is not null
        and garden_id is not null
        and exists (
          select 1 from public.gardens g
          where g.id = public.weather_hourly.garden_id
            and g.%I = auth.uid()
        )
      )
      with check (
        auth.uid() is not null
        and garden_id is not null
        and exists (
          select 1 from public.gardens g
          where g.id = public.weather_hourly.garden_id
            and g.%I = auth.uid()
        )
      );
  $f$, owner_col, owner_col);

  execute sql;
  raise notice 'Oprettet policy own weather via garden med gardens.%% = %', owner_col;
end $$;
