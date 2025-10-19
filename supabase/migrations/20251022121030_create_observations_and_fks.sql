-- create observations (if missing) + safe FKs
create extension if not exists "pgcrypto";

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
    create index if not exists idx_observations_status on public.observations(status);
    create index if not exists idx_observations_lat_lng on public.observations(lat, lng);
  end if;
end $$;

-- FKs (only if target tables exist and constraint not already present)
do $$
begin
  -- user_id -> profiles.id
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='profiles') then
    if not exists (
      select 1 from pg_constraint where conname='observations_user_id_fkey' and conrelid='public.observations'::regclass
    ) then
      execute $sql$ alter table public.observations
        add constraint observations_user_id_fkey
        foreign key (user_id) references public.profiles(id) on delete set null $sql$;
    end if;
  end if;

  -- garden_id -> gardens.id
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='gardens') then
    if not exists (
      select 1 from pg_constraint where conname='observations_garden_id_fkey' and conrelid='public.observations'::regclass
    ) then
      execute $sql$ alter table public.observations
        add constraint observations_garden_id_fkey
        foreign key (garden_id) references public.gardens(id) on delete cascade $sql$;
    end if;
  end if;

  -- pest_id -> pests.id
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='pests') then
    if not exists (
      select 1 from pg_constraint where conname='observations_pest_id_fkey' and conrelid='public.observations'::regclass
    ) then
      execute $sql$ alter table public.observations
        add constraint observations_pest_id_fkey
        foreign key (pest_id) references public.pests(id) on delete set null $sql$;
    end if;
  end if;

  -- disease_id -> diseases.id
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='diseases') then
    if not exists (
      select 1 from pg_constraint where conname='observations_disease_id_fkey' and conrelid='public.observations'::regclass
    ) then
      execute $sql$ alter table public.observations
        add constraint observations_disease_id_fkey
        foreign key (disease_id) references public.diseases(id) on delete set null $sql$;
    end if;
  end if;
end $$;
