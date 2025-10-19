-- Create bucket if not exists
do $$
begin
  if not exists (select 1 from storage.buckets where name = 'observation-photos') then
    perform storage.create_bucket('observation-photos', public => true); -- public read; skift til false hvis I vil bruge signed URLs
  end if;
end $$;

-- Storage RLS policies for storage.objects
-- NB: RLS er ON by default for storage.objects

-- Drop existing (idempotent)
do $$ begin
  if exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='obs_photos_read') then
    drop policy "obs_photos_read" on storage.objects;
  end if;
  if exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='obs_photos_insert') then
    drop policy "obs_photos_insert" on storage.objects;
  end if;
  if exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='obs_photos_update') then
    drop policy "obs_photos_update" on storage.objects;
  end if;
  if exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='obs_photos_delete') then
    drop policy "obs_photos_delete" on storage.objects;
  end if;
end $$;

-- READ: alle kan læse (fordi bucket er public). Hvis I ikke vil have public read, ændr til "to authenticated using (bucket_id='observation-photos')"
create policy "obs_photos_read" on storage.objects
  for select to public
  using (bucket_id = 'observation-photos');

-- INSERT: kun authenticated, filsti skal starte med 'uploads/'
create policy "obs_photos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'observation-photos'
    and (name like 'uploads/%')
  );

-- UPDATE/DELETE: kun admin (via helper-funktionen)
create policy "obs_photos_update" on storage.objects
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "obs_photos_delete" on storage.objects
  for delete to authenticated
  using (public.is_admin(auth.uid()));
