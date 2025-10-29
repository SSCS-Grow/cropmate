-- 202510261651_ai_rag.sql (robust)
-- Kræver: is_admin(uid uuid) eksisterer (fra tidligere migration)

-- 0) Extensions (idempotent)
create extension if not exists vector;
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- 1) Sørg for at library_items findes (minimalt skema)
do $$
begin
  if to_regclass('public.library_items') is null then
    execute $ct$
      create table public.library_items (
        id uuid primary key default gen_random_uuid(),
        title text not null,
        summary text,
        content text,
        slug text unique,
        published boolean default true,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    $ct$;

    -- basisindeks og RLS/policies hvis tabellen lige er blevet oprettet
    execute 'create index if not exists library_items_slug_idx on public.library_items (slug)';
    execute 'alter table public.library_items enable row level security';

    -- Alle kan læse published, admins kan alt (matcher din tidligere RLS-strategi)
    execute 'drop policy if exists "lib_public_read_published" on public.library_items';
    execute 'create policy "lib_public_read_published" on public.library_items
             for select using (coalesce(published, true) = true)';

    execute 'drop policy if exists "lib_admin_all" on public.library_items';
    execute 'create policy "lib_admin_all" on public.library_items
             for all using (is_admin(auth.uid()))';
  end if;
end
$$;

-- 2) Embeddingstabel (afhænger af library_items)
create table if not exists public.library_item_embeddings (
  item_id uuid primary key references public.library_items(id) on delete cascade,
  -- text-embedding-3-small = 1536 dimensioner
  embedding vector(1536),
  updated_at timestamptz not null default now()
);

-- 3) Index til hurtig søgning (pgvector)
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname='public' and tablename='library_item_embeddings'
      and indexname='library_item_embeddings_embedding_idx'
  ) then
    execute 'create index library_item_embeddings_embedding_idx
             on public.library_item_embeddings
             using ivfflat (embedding vector_cosine_ops) with (lists = 100)';
  end if;
end
$$;

-- 4) Match-funktion (returnerer id + similarity)
create or replace function public.match_library_items(query_embedding vector(1536), match_count int default 5)
returns table (item_id uuid, similarity float4)
language plpgsql stable as $$
begin
  return query
  select lie.item_id,
         1 - (lie.embedding <=> query_embedding) as similarity
  from public.library_item_embeddings lie
  order by lie.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 5) Security for funktionen + RLS for embeddings
alter function public.match_library_items(vector, int) security definer;
grant execute on function public.match_library_items(vector, int) to anon, authenticated;

alter table public.library_item_embeddings enable row level security;

drop policy if exists "emb_admin_all" on public.library_item_embeddings;
create policy "emb_admin_all" on public.library_item_embeddings
for all using (is_admin(auth.uid()));

-- 6) Storage-bucket + policies (idempotent, kompatibel med PG)
insert into storage.buckets (id, name, public)
select 'diagnose-uploads', 'diagnose-uploads', false
where not exists (select 1 from storage.buckets where id='diagnose-uploads');

-- INSERT policy
do $$
begin
  if not exists (
    select 1
    from pg_policies
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

-- SELECT policy (kun ejer ser sine filer)
do $$
begin
  if not exists (
    select 1
    from pg_policies
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

-- UPDATE policy (kun ejer)
do $$
begin
  if not exists (
    select 1
    from pg_policies
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

-- DELETE policy (kun ejer)
do $$
begin
  if not exists (
    select 1
    from pg_policies
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
