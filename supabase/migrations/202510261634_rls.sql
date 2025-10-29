-- 202510261634_rls.sql (robust/idempotent)

-- 1) Helper til admin-check (afhænger kun af profiles)
create or replace function is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select coalesce((select p.is_admin from profiles p where p.id = uid), false)
$$;

-- 2) PROFILES (kun hvis tabellen findes)
do $$
begin
  if to_regclass('public.profiles') is not null then
    -- RLS
    execute 'alter table public.profiles enable row level security';

    -- Policies
    execute 'drop policy if exists "profiles_select_self_or_admin" on public.profiles';
    execute 'create policy "profiles_select_self_or_admin" on public.profiles
             for select using (auth.uid() = id or is_admin(auth.uid()))';

    execute 'drop policy if exists "profiles_update_self_or_admin" on public.profiles';
    execute 'create policy "profiles_update_self_or_admin" on public.profiles
             for update using (auth.uid() = id or is_admin(auth.uid()))';
  end if;
end
$$;

-- 3) OBSERVATIONS (robust mht. kolonner)
do $$
declare
  has_published boolean := exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='published'
  );
  has_is_public boolean := exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='observations' and column_name='is_public'
  );
begin
  if to_regclass('public.observations') is not null then
    execute 'alter table public.observations enable row level security';

    -- Ejer + admin policies (uanset kolonner)
    execute 'drop policy if exists "obs_owner_read" on public.observations';
    execute 'create policy "obs_owner_read" on public.observations
             for select using (auth.uid() = user_id)';

    execute 'drop policy if exists "obs_owner_insert" on public.observations';
    execute 'create policy "obs_owner_insert" on public.observations
             for insert with check (auth.uid() = user_id)';

    execute 'drop policy if exists "obs_owner_update" on public.observations';
    execute 'create policy "obs_owner_update" on public.observations
             for update using (auth.uid() = user_id)';

    execute 'drop policy if exists "obs_owner_delete" on public.observations';
    execute 'create policy "obs_owner_delete" on public.observations
             for delete using (auth.uid() = user_id)';

    execute 'drop policy if exists "obs_admin_all" on public.observations';
    execute 'create policy "obs_admin_all" on public.observations
             as permissive for all using (is_admin(auth.uid()))';

    -- Public read KUN hvis vi har en egnet kolonne
    if has_published then
      execute 'drop policy if exists "obs_public_read" on public.observations';
      execute 'create policy "obs_public_read" on public.observations
               for select using (published = true)';
    elsif has_is_public then
      execute 'drop policy if exists "obs_public_read" on public.observations';
      execute 'create policy "obs_public_read" on public.observations
               for select using (is_public = true)';
    else
      -- Ingen public-read policy => alt er privat (kun ejer/admin)
      null;
    end if;
  end if;
end
$$;


-- 4) GARDEN_PLOTS
do $$
begin
  if to_regclass('public.garden_plots') is not null then
    execute 'alter table public.garden_plots enable row level security';

    execute 'drop policy if exists "plots_owner_all" on public.garden_plots';
    execute 'create policy "plots_owner_all" on public.garden_plots
             for all using (auth.uid() = user_id)';

    execute 'drop policy if exists "plots_admin_all" on public.garden_plots';
    execute 'create policy "plots_admin_all" on public.garden_plots
             for all using (is_admin(auth.uid()))';
  end if;
end
$$;

-- 5) HAZARD_REPORTS (robust mht. kolonner)
do $$
declare
  has_published boolean := exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='hazard_reports' and column_name='published'
  );
  has_is_public boolean := exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='hazard_reports' and column_name='is_public'
  );
begin
  if to_regclass('public.hazard_reports') is not null then
    execute 'alter table public.hazard_reports enable row level security';

    -- Ejer + admin policies
    execute 'drop policy if exists "haz_owner_read" on public.hazard_reports';
    execute 'create policy "haz_owner_read" on public.hazard_reports
             for select using (auth.uid() = user_id)';

    execute 'drop policy if exists "haz_owner_insert" on public.hazard_reports';
    execute 'create policy "haz_owner_insert" on public.hazard_reports
             for insert with check (auth.uid() = user_id)';

    execute 'drop policy if exists "haz_owner_update" on public.hazard_reports';
    execute 'create policy "haz_owner_update" on public.hazard_reports
             for update using (auth.uid() = user_id)';

    execute 'drop policy if exists "haz_owner_delete" on public.hazard_reports';
    execute 'create policy "haz_owner_delete" on public.hazard_reports
             for delete using (auth.uid() = user_id)';

    execute 'drop policy if exists "haz_admin_all" on public.hazard_reports';
    execute 'create policy "haz_admin_all" on public.hazard_reports
             for all using (is_admin(auth.uid()))';

    -- Public read hvis kolonne findes
    if has_published then
      execute 'drop policy if exists "haz_public_read" on public.hazard_reports';
      execute 'create policy "haz_public_read" on public.hazard_reports
               for select using (published = true)';
    elsif has_is_public then
      execute 'drop policy if exists "haz_public_read" on public.hazard_reports';
      execute 'create policy "haz_public_read" on public.hazard_reports
               for select using (is_public = true)';
    else
      null;
    end if;
  end if;
end
$$;


-- 6) LIBRARY_ITEMS
do $$
begin
  if to_regclass('public.library_items') is not null then
    execute 'alter table public.library_items enable row level security';

    execute 'drop policy if exists "lib_public_read_published" on public.library_items';
    execute 'create policy "lib_public_read_published" on public.library_items
             for select using (published = true)';

    execute 'drop policy if exists "lib_admin_all" on public.library_items';
    execute 'create policy "lib_admin_all" on public.library_items
             for all using (is_admin(auth.uid()))';
  end if;
end
$$;

-- 7) LIBRARY_IMAGES
do $$
begin
  if to_regclass('public.library_images') is not null then
    execute 'alter table public.library_images enable row level security';

    execute 'drop policy if exists "libimg_public_read" on public.library_images';
    execute 'create policy "libimg_public_read" on public.library_images
             for select using (true)';

    execute 'drop policy if exists "libimg_admin_all" on public.library_images';
    execute 'create policy "libimg_admin_all" on public.library_images
             for all using (is_admin(auth.uid()))';
  end if;
end
$$;
