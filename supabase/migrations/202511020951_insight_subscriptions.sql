-- Opret tabel til abonnementer på indsigter
create table if not exists public.insight_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- BBOX: minLat, minLng, maxLat, maxLng
  bbox_min_lat double precision not null,
  bbox_min_lng double precision not null,
  bbox_max_lat double precision not null,
  bbox_max_lng double precision not null,
  days integer not null default 7 check (days between 1 and 30),
  threshold_pct integer not null default 50,        -- trendPct ≥ threshold
  min_recent integer not null default 5,            -- mindst N nylige observationer
  hazards text[] default null,                      -- valgfri filter (lowercased slugs/navne)
  active boolean not null default true,
  created_at timestamp with time zone default now()
);

-- Indexer til hurtig søgning
create index if not exists idx_ins_sub_user on public.insight_subscriptions (user_id);
create index if not exists idx_ins_sub_active on public.insight_subscriptions (active);

-- RLS
alter table public.insight_subscriptions enable row level security;

-- Ejere må alt på egne rækker
create policy "insight_subs_select_own"
on public.insight_subscriptions for select
using (auth.uid() = user_id);

create policy "insight_subs_insert_own"
on public.insight_subscriptions for insert
with check (auth.uid() = user_id);

create policy "insight_subs_update_own"
on public.insight_subscriptions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "insight_subs_delete_own"
on public.insight_subscriptions for delete
using (auth.uid() = user_id);

-- Alerts-tabellen antages at eksistere (public.alerts)
-- Hvis du vil have en ny type:
-- alter type alert_kind add value if not exists 'insight';
