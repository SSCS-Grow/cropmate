-- v0.6 fix: create observations if missing + safe FKs

-- 1) Sikr nødvendige extensions
create extension if not exists "pgcrypto";

-- 2) Opret observations hvis den ikke findes
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='observations'
  ) then
    create table public.observations (
      id uuid primary key default gen_random_uuid(),
      user_id uuid,
      garden_id uuid,
      pest_id uuid,
      disease_id uuid,
      title text not null,
      description text,
      lat double precision not null,
      lng double precision not null,
      photo_url text,
      taken_at timestamptz,
      status text default 'active',
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    create index if not exists idx_observations_created_at on public.observations(created_at desc);
  end if;
end $$;

-- 3) Læg FKs på (kun hvis referenced tabeller/kolonner findes, og constraints ikke allerede er der)
do $$
declare
  conname text;
begin
  -- FK: observations.user_id -> profiles.id
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='profiles')
  then
    select conname into conname from pg_constraint
      where conname='observations_user_id_fkey' and conrelid='public.observations'::regclass;
    if conname is null then
      execute 'alter table public.observations
               add constraint observations_user_id_fkey
               foreign key (user_id) references public.profiles(id) on delete set null';
    end if;
  end if;

  -- FK: observations.garden_id -> gardens.id
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='gardens')
  then
    select conname into conname from pg_constraint
      where conname='observations_garden_id_fkey' and conrelid='public.observations'::regclass;
    if conname is null then
      execute 'alter table public.observations
               add constraint observations_garden_id_fkey
               foreign key (garden_id) references public.gardens(id) on delete cascade';
    end if;
  end if;

  -- FK: observations.pest_id -> pests.id
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='pests')
  then
    select conname into conname from pg_constraint
      where conname='observations_pest_id_fkey' and conrelid='public.observations'::regclass;
    if conname is null then
      execute 'alter table public.observations
               add constraint observations_pest_id_fkey
               foreign key (pest_id) references public.pests(id) on delete set null';
    end if;
  end if;

  -- FK: observations.disease_id -> diseases.id
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='diseases')
  then
    select conname into conname from pg_constraint
      where conname='observations_disease_id_fkey' and conrelid='public.observations'::regclass;
    if conname is null then
      execute 'alter table public.observations
               add constraint observations_disease_id_fkey
               foreign key (disease_id) references public.diseases(id) on delete set null';
    end if;
  end if;
end $$;

-- 4) Praktiske indeks
create index if not exists idx_observations_status on public.observations(status);
create index if not exists idx_observations_lat_lng on public.observations(lat, lng);
