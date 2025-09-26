-- 021_storage_hazard_photos.sql
-- Bucket + RLS policies for hazard photos

------------------------------------------------------------
-- Create public bucket if missing
------------------------------------------------------------
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'hazard-photos') then
    perform storage.create_bucket('hazard-photos', public := true);
  else
    -- ensure it's public
    update storage.buckets set public = true where id = 'hazard-photos';
  end if;
end$$;

------------------------------------------------------------
-- Row Level Security on storage.objects
--  - Public READ for this bucket
--  - INSERT/UPDATE/DELETE restricted to owner or admin
--  - Enforce key convention: name starts with "<auth.uid()>/"
------------------------------------------------------------
-- (storage.objects has RLS enabled by default in Supabase)

-- Helper predicate for admin
--   exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)

-- 1) Public read of objects in this bucket
drop policy if exists hazard_photos_public_read on storage.objects;
create policy hazard_photos_public_read
on storage.objects
for select
using (
  bucket_id = 'hazard-photos'
);

-- 2) List objects (same as SELECT)
drop policy if exists hazard_photos_public_list on storage.objects;
create policy hazard_photos_public_list
on storage.objects
for select
using (
  bucket_id = 'hazard-photos'
);

-- 3) Insert only by authenticated user, into their own namespace "<uid>/..."
drop policy if exists hazard_photos_owner_insert on storage.objects;
create policy hazard_photos_owner_insert
on storage.objects
for insert
with check (
  bucket_id = 'hazard-photos'
  and owner = auth.uid()
  and name like (auth.uid()::text || '/%')
);

-- 4) Update by owner or admin
drop policy if exists hazard_photos_owner_update_or_admin on storage.objects;
create policy hazard_photos_owner_update_or_admin
on storage.objects
for update
using (
  bucket_id = 'hazard-photos'
  and (
    owner = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  )
)
with check (
  bucket_id = 'hazard-photos'
  and (
    owner = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  )
);

-- 5) Delete by owner or admin
drop policy if exists hazard_photos_owner_delete_or_admin on storage.objects;
create policy hazard_photos_owner_delete_or_admin
on storage.objects
for delete
using (
  bucket_id = 'hazard-photos'
  and (
    owner = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  )
);

------------------------------------------------------------
-- (Optional) Disallow writes to root (no "<uid>" prefix)
-- Already enforced via the INSERT check (name like '<uid>/%')
------------------------------------------------------------

-- Done.
