-- alert_rules: create-if-missing + garden_id + FK + index + RLS (robust)

create extension if not exists pgcrypto;

-- 1) Sørg for at tabellen findes
create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid null,
  name text not null default 'Vejrregel',
  is_enabled boolean not null default true,
  garden_id uuid null,
  condition jsonb not null,
  last_fired_at timestamptz null,
  created_at timestamptz not null default now()
);

-- 2) Kolonnen (hvis du har en ældre tabel uden garden_id)
alter table if exists public.alert_rules
  add column if not exists garden_id uuid null;

-- 3) Indeks
create index if not exists alert_rules_garden_idx on public.alert_rules(garden_id);
create index if not exists alert_rules_last_fired_idx on public.alert_rules(last_fired_at);

-- 4) FK’er – kun hvis BÅDE alert_rules og gardens findes
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='alert_rules'
  ) and exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='gardens'
  ) then
    if not exists (select 1 from pg_constraint where conname='alert_rules_garden_fk') then
      alter table public.alert_rules
        add constraint alert_rules_garden_fk
        foreign key (garden_id) references public.gardens(id) on delete set null;
    end if;
  end if;
end $$;

-- 5) RLS (robust): enable + owner-policy via profile_id
alter table public.alert_rules enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='alert_rules' and policyname='own alert rules by profile'
  ) then
    create policy "own alert rules by profile" on public.alert_rules
      for all
      using (auth.uid() is not null and profile_id = auth.uid())
      with check (auth.uid() is not null and profile_id = auth.uid());
  end if;
end $$;
