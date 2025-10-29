-- 20251029_observations.sql
-- Opretter/udvider observations-tabel og sikrer RLS/policies (idempotent).

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.observations') is null then
    execute $ct$
      create table public.observations (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null,
        plant text,
        symptoms_text text not null,
        diagnosis text,
        photo_url text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    $ct$;
    -- relation til auth.users (soft ref – Supabase tillader ikke FK direkte til auth.users i alle planer, men prøv hvis ønsket):
    -- alter table public.observations add constraint observations_user_fk foreign key (user_id) references auth.users(id);
  end if;

  -- Kolonner (idempotent tilføj)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='observations' and column_name='plant') then
    execute 'alter table public.observations add column plant text';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='observations' and column_name='symptoms_text') then
    execute 'alter table public.observations add column symptoms_text text not null default ''''';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='observations' and column_name='diagnosis') then
    execute 'alter table public.observations add column diagnosis text';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='observations' and column_name='photo_url') then
    execute 'alter table public.observations add column photo_url text';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='observations' and column_name='created_at') then
    execute 'alter table public.observations add column created_at timestamptz not null default now()';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='observations' and column_name='updated_at') then
    execute 'alter table public.observations add column updated_at timestamptz not null default now()';
  end if;

  -- Index til ejers opslag
  if not exists (
    select 1 from pg_indexes where schemaname='public' and tablename='observations' and indexname='observations_user_idx'
  ) then
    execute 'create index observations_user_idx on public.observations (user_id)';
  end if;

  -- RLS + policies (owner CRUD, admin alt) – kræver is_admin(uid) fra tidligere migration
  execute 'alter table public.observations enable row level security';

  -- Owner-læs
  if exists (select 1 from pg_policies where schemaname='public' and tablename='observations' and policyname='obs_owner_read') then
    execute 'drop policy "obs_owner_read" on public.observations';
  end if;
  execute 'create policy "obs_owner_read" on public.observations for select using (auth.uid() = user_id)';

  -- Owner-insert
  if exists (select 1 from pg_policies where schemaname='public' and tablename='observations' and policyname='obs_owner_insert') then
    execute 'drop policy "obs_owner_insert" on public.observations';
  end if;
  execute 'create policy "obs_owner_insert" on public.observations for insert with check (auth.uid() = user_id)';

  -- Owner-update
  if exists (select 1 from pg_policies where schemaname='public' and tablename='observations' and policyname='obs_owner_update') then
    execute 'drop policy "obs_owner_update" on public.observations';
  end if;
  execute 'create policy "obs_owner_update" on public.observations for update using (auth.uid() = user_id)';

  -- Owner-delete
  if exists (select 1 from pg_policies where schemaname='public' and tablename='observations' and policyname='obs_owner_delete') then
    execute 'drop policy "obs_owner_delete" on public.observations';
  end if;
  execute 'create policy "obs_owner_delete" on public.observations for delete using (auth.uid() = user_id)';

  -- Admin alt
  if exists (select 1 from pg_policies where schemaname='public' and tablename='observations' and policyname='obs_admin_all') then
    execute 'drop policy "obs_admin_all" on public.observations';
  end if;
  execute 'create policy "obs_admin_all" on public.observations as permissive for all using (is_admin(auth.uid()))';

end
$$;
