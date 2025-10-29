-- 1) Køtabel – ét item pr. gang (seneste vinder)
create table if not exists public.library_reindex_queue (
  item_id uuid primary key,
  reason text,
  updated_at timestamptz not null default now()
);

-- (ingen RLS – kun SR/cron bruger tabellen)

-- 2) Triggerfunktion: enqueue ved ændringer
create or replace function public.enqueue_library_reindex()
returns trigger
language plpgsql
as $$
begin
  -- Brug upsert for at undgå dubletter og altid bump updated_at
  insert into public.library_reindex_queue (item_id, reason, updated_at)
  values (coalesce(NEW.id, OLD.id), TG_OP, now())
  on conflict (item_id) do update
    set reason = EXCLUDED.reason,
        updated_at = EXCLUDED.updated_at;
  return null;
end;
$$;

-- 3) Triggers på library_items
do $$
begin
  if to_regclass('public.library_items') is not null then
    -- INSERT + UPDATE
    if not exists (
      select 1 from pg_trigger
      where tgname = 'trg_library_items_enqueue_upsert'
    ) then
      execute $t$
        create trigger trg_library_items_enqueue_upsert
        after insert or update on public.library_items
        for each row execute function public.enqueue_library_reindex();
      $t$;
    end if;

    -- DELETE
    if not exists (
      select 1 from pg_trigger
      where tgname = 'trg_library_items_enqueue_delete'
    ) then
      execute $t$
        create trigger trg_library_items_enqueue_delete
        after delete on public.library_items
        for each row execute function public.enqueue_library_reindex();
      $t$;
    end if;
  end if;
end
$$;
