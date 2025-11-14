-- Ensure pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) Add missing columns (idempotent)
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='observations' and column_name='org_id') then
    alter table public.observations add column org_id uuid;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='observations' and column_name='field_id') then
    alter table public.observations add column field_id uuid;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='observations' and column_name='observed_at') then
    alter table public.observations add column observed_at timestamptz;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='observations' and column_name='type') then
    alter table public.observations add column "type" text;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='observations' and column_name='severity') then
    alter table public.observations add column severity int;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='observations' and column_name='notes') then
    alter table public.observations add column notes text;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='observations' and column_name='photo_url') then
    alter table public.observations add column photo_url text;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='observations' and column_name='updated_at') then
    alter table public.observations add column updated_at timestamptz default now();
  end if;
end$$;

-- 2) Backfill sensible defaults for new columns
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='observed_at'
  ) then
    execute 'update public.observations set observed_at = coalesce(observed_at, created_at, now())';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='severity'
  ) then
    execute 'update public.observations set severity = coalesce(severity, 0)';
  end if;
end$$;

-- If you want to carry over existing 'status' into 'type' (optional):
-- update public.observations set "type" = coalesce("type", status::text);

-- 3) Add useful checks if missing
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='type'
  ) then
    if not exists (select 1 from pg_constraint where conname='observations_type_len_check') then
      execute 'alter table public.observations add constraint observations_type_len_check check (char_length("type") <= 64)';
    end if;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='severity'
  ) then
    if not exists (select 1 from pg_constraint where conname='observations_severity_range_check') then
      execute 'alter table public.observations add constraint observations_severity_range_check check (severity between 0 and 5)';
    end if;
  end if;
end$$;

-- 4) Indexes for timeline filters (idempotent)
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

-- 5) Enable RLS (safe to repeat)
alter table public.observations enable row level security;

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

-- 7) Storage bucket + policies for photos (idempotent)
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
