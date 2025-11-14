-- =========================
-- Repair migration for existing public.observations
-- Safely add any missing columns, constraints, indexes, and policies
-- =========================

-- Ensure pgcrypto is available (safe if already installed)
create extension if not exists pgcrypto;

-- 1) Add missing columns (nullable first to avoid failing on existing rows)
do $$
begin
  if to_regclass('public.user_orgs') is null then
    return;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='org_id'
  ) then
    alter table public.observations add column org_id uuid;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='field_id'
  ) then
    alter table public.observations add column field_id uuid;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='user_id'
  ) then
    alter table public.observations add column user_id uuid;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='observed_at'
  ) then
    alter table public.observations add column observed_at timestamptz default now();
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='type'
  ) then
    alter table public.observations add column "type" text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='severity'
  ) then
    alter table public.observations add column severity int;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='notes'
  ) then
    alter table public.observations add column notes text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='photo_url'
  ) then
    alter table public.observations add column photo_url text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='created_at'
  ) then
    alter table public.observations add column created_at timestamptz default now();
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='updated_at'
  ) then
    alter table public.observations add column updated_at timestamptz default now();
  end if;
end$$;

-- 2) Backfill minimal defaults if necessary (only for rows where columns are null)
-- (Adjust org_id/field_id/user_id backfills to your data model if you already have rows)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='observed_at'
  ) then
    execute 'update public.observations set observed_at = coalesce(observed_at, now())';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='severity'
  ) then
    execute 'update public.observations set severity = coalesce(severity, 0)';
  end if;
end$$;

-- 3) Tighten constraints/checks if they don't exist yet
-- length check on type
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='type'
  ) then
    if not exists (
      select 1 from pg_constraint
      where conname = 'observations_type_len_check'
    ) then
      execute 'alter table public.observations add constraint observations_type_len_check check (char_length("type") <= 64)';
    end if;
  end if;
end$$;

-- severity between 0 and 5
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='severity'
  ) then
    if not exists (
      select 1 from pg_constraint
      where conname = 'observations_severity_range_check'
    ) then
      execute 'alter table public.observations add constraint observations_severity_range_check check (severity between 0 and 5)';
    end if;
  end if;
end$$;

-- Optionally enforce NOT NULL once columns exist (skipped if any rows contain NULLs)
-- (Removed for portability on lean installs; add your own strict constraints in a follow-up migration if required.)

-- 4) Indexes (only create if missing)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='org_id'
  ) then
    if not exists (
      select 1 from pg_indexes
      where schemaname='public' and indexname='observations_org_observed_idx'
    ) then
      execute 'create index observations_org_observed_idx on public.observations (org_id, observed_at desc)';
    end if;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='field_id'
  ) then
    if not exists (
      select 1 from pg_indexes
      where schemaname='public' and indexname='observations_field_observed_idx'
    ) then
      execute 'create index observations_field_observed_idx on public.observations (field_id, observed_at desc)';
    end if;
  end if;
end$$;

-- 5) RLS enable (idempotent)
do $$
begin
  perform 1
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname='public' and c.relname='observations' and c.relkind='r';

  -- Enable RLS (safe to run repeatedly)
  execute 'alter table public.observations enable row level security';
end$$;

-- 6) Policies (create only if missing)
do $$
begin
  if to_regclass('public.user_orgs') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='observations' and policyname='org members can read observations'
  ) then
    execute 'create policy "org members can read observations" on public.observations for select using (exists (select 1 from public.user_orgs uo where uo.org_id = observations.org_id and uo.user_id = auth.uid()))';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='observations' and policyname='org members can insert observations'
  ) then
    execute 'create policy "org members can insert observations" on public.observations for insert with check (exists (select 1 from public.user_orgs uo where uo.org_id = observations.org_id and uo.user_id = auth.uid()))';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='observations' and policyname='org members can update observations'
  ) then
    execute 'create policy "org members can update observations" on public.observations for update using (exists (select 1 from public.user_orgs uo where uo.org_id = observations.org_id and uo.user_id = auth.uid())) with check (exists (select 1 from public.user_orgs uo where uo.org_id = observations.org_id and uo.user_id = auth.uid()))';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='observations' and policyname='org members can delete observations'
  ) then
    execute 'create policy "org members can delete observations" on public.observations for delete using (exists (select 1 from public.user_orgs uo where uo.org_id = observations.org_id and uo.user_id = auth.uid()))';
  end if;
end$$;

-- 7) Storage bucket + policies (idempotent)
insert into storage.buckets (id, name, public)
select 'observations', 'observations', true
where not exists (select 1 from storage.buckets where id='observations');

do $$
begin
  if to_regclass('storage.objects') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects' and policyname='Public read observations'
  ) then
    execute 'create policy "Public read observations" on storage.objects for select using (bucket_id = ''observations'')';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects' and policyname='Org write observations'
  ) then
    execute 'create policy "Org write observations" on storage.objects for insert to authenticated with check (bucket_id = ''observations'')';
  end if;
end$$;
