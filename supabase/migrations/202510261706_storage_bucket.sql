-- 202510261706_storage_bucket.sql
-- Storage bucket + policies til diagnose-uploads (PG-kompatibel)

-- 1) Opret bucket, hvis den ikke findes (idempotent)
insert into storage.buckets (id, name, public)
select 'diagnose-uploads', 'diagnose-uploads', false
where not exists (select 1 from storage.buckets where id = 'diagnose-uploads');

-- 2) INSERT policy (authenticated må uploade til bucketen)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'diag_owner_insert'
  ) then
    execute $sql$
      create policy "diag_owner_insert"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'diagnose-uploads');
    $sql$;
  end if;
end
$$;

-- 3) SELECT policy (kun ejer ser sine filer i bucketen)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'diag_owner_select'
  ) then
    execute $sql$
      create policy "diag_owner_select"
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'diagnose-uploads' and owner = auth.uid());
    $sql$;
  end if;
end
$$;

-- 4) UPDATE policy (kun ejer kan opdatere)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'diag_owner_update'
  ) then
    execute $sql$
      create policy "diag_owner_update"
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'diagnose-uploads' and owner = auth.uid());
    $sql$;
  end if;
end
$$;

-- 5) DELETE policy (kun ejer kan slette)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'diag_owner_delete'
  ) then
    execute $sql$
      create policy "diag_owner_delete"
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'diagnose-uploads' and owner = auth.uid());
    $sql$;
  end if;
end
$$;
