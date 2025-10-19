create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='weather_hourly'
  ) then
    create table public.weather_hourly (
      id uuid primary key default gen_random_uuid(),
      garden_id uuid,
      time timestamptz not null,
      temperature_c numeric,
      precipitation_mm numeric,
      wind_ms numeric,
      created_at timestamptz default now()
    );
    create index if not exists idx_weather_hourly_garden_time on public.weather_hourly(garden_id, time desc);
  end if;
end $$;
