-- 001_schema_core.sql
-- Core schema for CropMate MVP
-- Tables: profiles, crops, user_crops, tasks, alerts, hazard_reports
-- RLS: own-data visibility, public read for crops, admin override via profiles.is_admin

------------------------------------------------------------
-- Extensions
------------------------------------------------------------
create extension if not exists "pgcrypto";     -- for gen_random_uuid()

------------------------------------------------------------
-- Helper: admin-check (via profiles)
------------------------------------------------------------
-- We use a simple SQL expression in policies:
--    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
-- No separate function required; keeps it transparent.

------------------------------------------------------------
-- Enums
------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('pending','done','skipped');
  end if;

  if not exists (select 1 from pg_type where typname = 'alert_level') then
    create type alert_level as enum ('info','warning','danger');
  end if;

  if not exists (select 1 from pg_type where typname = 'hazard_status') then
    create type hazard_status as enum ('visible','flagged','hidden');
  end if;
end$$;

------------------------------------------------------------
-- Tables
------------------------------------------------------------

-- 1) profiles (one row per auth user)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- keep updated_at fresh
create or replace trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure pg_catalog.tsvector_update_trigger(); -- placeholder to force trigger existence
-- Replace with a simple updated_at trigger (Supabase lacks a built-in one), so we use a tiny function:
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'set_updated_at') then
    create or replace function public.set_updated_at() returns trigger language plpgsql as $fn$
    begin
      new.updated_at := now();
      return new;
    end$fn$;
  end if;
end$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- 2) crops (public catalog)
create table if not exists public.crops (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name_da      text not null,
  name_en      text,
  category     text,
  description  text,
  created_at   timestamptz not null default now()
);

-- 3) user_crops (a user’s garden items)
create table if not exists public.user_crops (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  crop_id      uuid not null references public.crops(id) on delete restrict,
  nickname     text,
  notes        text,
  planted_at   date,
  location_lat double precision,
  location_lon double precision,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_user_crops_updated_at on public.user_crops;
create trigger trg_user_crops_updated_at
before update on public.user_crops
for each row execute procedure public.set_updated_at();

-- 4) tasks (watering, pruning, etc.)
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  crop_id      uuid references public.crops(id) on delete set null,
  title        text not null,
  details      text,
  due_at       timestamptz,
  status       task_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

-- 5) alerts (system/user notifications)
create table if not exists public.alerts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null,               -- e.g. 'frost', 'watering'
  level        alert_level not null default 'info',
  message      text not null,
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);

-- 6) hazard_reports (map observations)
create table if not exists public.hazard_reports (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  crop_id        uuid references public.crops(id) on delete set null,
  lat            double precision not null,
  lon            double precision not null,
  observed_at    timestamptz not null default now(),
  severity       integer,              -- 1..5 (optional)
  note           text,
  status         hazard_status not null default 'visible',
  flagged_count  integer not null default 0,
  photo_paths    text[] default '{}'::text[],  -- storage object paths in bucket `hazard-photos`
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists trg_hazard_reports_updated_at on public.hazard_reports;
create trigger trg_hazard_reports_updated_at
before update on public.hazard_reports
for each row execute procedure public.set_updated_at();

------------------------------------------------------------
-- Row Level Security
------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.crops           enable row level security;
alter table public.user_crops      enable row level security;
alter table public.tasks           enable row level security;
alter table public.alerts          enable row level security;
alter table public.hazard_reports  enable row level security;

-- Helper predicate reused inline:
--   is_admin: exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)

------------------------------------------------------------
-- profiles policies (user sees/edits own profile, admin sees all)
------------------------------------------------------------
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles
for select
using (
  id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin
on public.profiles
for update
using (
  id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
)
with check (
  -- prevent non-admins from setting is_admin on others
  id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles
for insert
with check ( id = auth.uid() );

------------------------------------------------------------
-- crops policies (public read; admin manage)
------------------------------------------------------------
drop policy if exists crops_public_read on public.crops;
create policy crops_public_read
on public.crops
for select
using ( true );  -- public catalog

drop policy if exists crops_admin_write on public.crops;
create policy crops_admin_write
on public.crops
for all
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

------------------------------------------------------------
-- user_crops policies (owner full access; admin full)
------------------------------------------------------------
drop policy if exists user_crops_select_own_or_admin on public.user_crops;
create policy user_crops_select_own_or_admin
on public.user_crops
for select
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

drop policy if exists user_crops_write_own_or_admin on public.user_crops;
create policy user_crops_write_own_or_admin
on public.user_crops
for all
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
)
with check (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

------------------------------------------------------------
-- tasks policies (owner full access; admin full)
------------------------------------------------------------
drop policy if exists tasks_select_own_or_admin on public.tasks;
create policy tasks_select_own_or_admin
on public.tasks
for select
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

drop policy if exists tasks_write_own_or_admin on public.tasks;
create policy tasks_write_own_or_admin
on public.tasks
for all
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
)
with check (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

------------------------------------------------------------
-- alerts policies (owner full access; admin full)
------------------------------------------------------------
drop policy if exists alerts_select_own_or_admin on public.alerts;
create policy alerts_select_own_or_admin
on public.alerts
for select
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

drop policy if exists alerts_write_own_or_admin on public.alerts;
create policy alerts_write_own_or_admin
on public.alerts
for all
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
)
with check (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

------------------------------------------------------------
-- hazard_reports policies
--  - Public can SELECT visible reports
--  - Owner can SELECT/UPDATE/DELETE own reports (any status)
--  - Admin can SELECT/INSERT/UPDATE/DELETE all
--  - Any authenticated user can INSERT with user_id = auth.uid()
------------------------------------------------------------
drop policy if exists hazard_public_select_visible on public.hazard_reports;
create policy hazard_public_select_visible
on public.hazard_reports
for select
using (
  status = 'visible'
  or user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

drop policy if exists hazard_owner_write_or_admin on public.hazard_reports;
create policy hazard_owner_write_or_admin
on public.hazard_reports
for update
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
)
with check (
  -- owner can change their rows; admin can change all rows (including status)
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

drop policy if exists hazard_owner_delete_or_admin on public.hazard_reports;
create policy hazard_owner_delete_or_admin
on public.hazard_reports
for delete
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

drop policy if exists hazard_insert_self_or_admin on public.hazard_reports;
create policy hazard_insert_self_or_admin
on public.hazard_reports
for insert
with check (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

------------------------------------------------------------
-- Defaults/guards
------------------------------------------------------------
-- Make sure no row sneaks in without user_id when required (redundant with NOT NULL + policies, but explicit):
alter table public.user_crops
  alter column user_id set not null;
alter table public.tasks
  alter column user_id set not null;
alter table public.alerts
  alter column user_id set not null;
alter table public.hazard_reports
  alter column user_id set not null;

-- Done.
