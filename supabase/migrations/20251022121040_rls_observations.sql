-- RLS for observations: owner CRUD, admin override

-- helper: is_admin(uid)
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select coalesce((select is_admin from public.profiles where id = uid), false)
$$;

-- enable RLS
alter table public.observations enable row level security;

-- drop old policies if any (idempotent)
do $$ begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='observations' and policyname='obs_select') then
    drop policy "obs_select" on public.observations;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='observations' and policyname='obs_insert') then
    drop policy "obs_insert" on public.observations;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='observations' and policyname='obs_update') then
    drop policy "obs_update" on public.observations;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='observations' and policyname='obs_delete') then
    drop policy "obs_delete" on public.observations;
  end if;
end $$;

-- SELECT: alle kan se 'active', owner ser egne, admin ser alt
create policy "obs_select" on public.observations
  for select using (
    status = 'active'
    or user_id = auth.uid()
    or public.is_admin(auth.uid())
  );

-- INSERT: owner (user_id = auth.uid()) eller admin
create policy "obs_insert" on public.observations
  for insert with check (
    (user_id = auth.uid()) or public.is_admin(auth.uid())
  );

-- UPDATE: owner eller admin
create policy "obs_update" on public.observations
  for update using (
    user_id = auth.uid() or public.is_admin(auth.uid())
  )
  with check (
    user_id = auth.uid() or public.is_admin(auth.uid())
  );

-- DELETE: owner eller admin
create policy "obs_delete" on public.observations
  for delete using (
    user_id = auth.uid() or public.is_admin(auth.uid())
  );
