-- 030_indexes_constraints.sql
-- Unikke constraints og indeks for kerne-tabeller

------------------------------------------------------------
-- profiles
------------------------------------------------------------
-- Hurtig lookup på username
create index if not exists idx_profiles_username on public.profiles (username);

------------------------------------------------------------
-- crops
------------------------------------------------------------
-- Slug er allerede unique; tilføj evt. name-da lookup
create index if not exists idx_crops_name_da on public.crops (name_da);

------------------------------------------------------------
-- user_crops
------------------------------------------------------------
-- Undgå (bløde) dubletter: samme bruger + samme crop + samme planted_at
-- (Hvis man vil tillade flere ens, fjern denne.)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_crops_uniq_user_crop_planted'
  ) then
    alter table public.user_crops
      add constraint user_crops_uniq_user_crop_planted
      unique (user_id, crop_id, planted_at);
  end if;
end$$;

-- Hurtig mine-planter-oversigt
create index if not exists idx_user_crops_user_created
  on public.user_crops (user_id, created_at desc);

------------------------------------------------------------
-- tasks
------------------------------------------------------------
-- (Blød) unikhed for opgaver pr. bruger omkring samme tidspunkt
-- Titler kan gentages, men kombinationen begrænser dubletter
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_uniq_user_title_due'
  ) then
    alter table public.tasks
      add constraint tasks_uniq_user_title_due
      unique (user_id, title, due_at);
  end if;
end$$;

-- Indeks til dashboard/oversigt
create index if not exists idx_tasks_user_due
  on public.tasks (user_id, due_at);
create index if not exists idx_tasks_user_status
  on public.tasks (user_id, status, due_at);

------------------------------------------------------------
-- alerts
------------------------------------------------------------
-- Hurtig “ulæste først”
create index if not exists idx_alerts_user_created
  on public.alerts (user_id, created_at desc);
create index if not exists idx_alerts_user_unread
  on public.alerts (user_id)
  where read_at is null;

------------------------------------------------------------
-- hazard_reports (supplerende)
------------------------------------------------------------
-- Kombi-indeks til moderation efter “flagged først”
create index if not exists idx_hazard_reports_flagged
  on public.hazard_reports (status, flagged_count desc, created_at desc);

-- (Valgfrit) Kompakt index til “mine + synlige”
create index if not exists idx_hazard_reports_visible_user
  on public.hazard_reports (user_id, created_at desc)
  where status = 'visible';
