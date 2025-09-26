-- 020_hazard_reports.sql
-- Extra constraints, helpers og indexes for hazard_reports

------------------------------------------------------------
-- Constraints / guards
------------------------------------------------------------
-- Severity skal være 1..5 (eller NULL hvis ikke brugt)
alter table public.hazard_reports
  add constraint hazard_reports_severity_ck
  check (severity is null or (severity >= 1 and severity <= 5));

-- Koordinater indenfor simple bounds (ikke fuld validering, men fanger tydelige fejl)
alter table public.hazard_reports
  add constraint hazard_reports_lat_ck check (lat between -90 and 90),
  add constraint hazard_reports_lon_ck check (lon between -180 and 180);

-- flagged_count må ikke blive negativ
alter table public.hazard_reports
  add constraint hazard_reports_flagged_count_ck check (flagged_count >= 0);

------------------------------------------------------------
-- Helper functions: flag / unflag (opdaterer flagged_count)
-- Bruges fra API, ikke i policies.
------------------------------------------------------------
create or replace function public.hazard_flag(p_id uuid)
returns void
language sql
as $$
  update public.hazard_reports
     set flagged_count = coalesce(flagged_count,0) + 1
   where id = p_id;
$$;

create or replace function public.hazard_unflag(p_id uuid)
returns void
language sql
as $$
  update public.hazard_reports
     set flagged_count = greatest(coalesce(flagged_count,0) - 1, 0)
   where id = p_id;
$$;

------------------------------------------------------------
-- (Valgfrit) Status-transition guard via trigger:
--  - Non-admin må ikke sætte status=visible hvis den var hidden (kun admin)
--  - Owner må gerne skifte mellem visible/flagged
------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'hazard_status_guard') then
    create or replace function public.hazard_status_guard()
    returns trigger
    language plpgsql
    as $fn$
    declare
      v_is_admin boolean := exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_admin
      );
    begin
      if (old.status = 'hidden' and new.status = 'visible' and not v_is_admin) then
        raise exception 'Only admin can unhide a hidden hazard';
      end if;
      return new;
    end;
    $fn$;
  end if;
end$$;

drop trigger if exists trg_hazard_status_guard on public.hazard_reports;
create trigger trg_hazard_status_guard
before update of status on public.hazard_reports
for each row execute procedure public.hazard_status_guard();

------------------------------------------------------------
-- Indexes (hurtige forespørgsler)
------------------------------------------------------------
-- 1) Status + tid (typisk til moderation/oversigter)
create index if not exists idx_hazard_reports_status_created
  on public.hazard_reports (status, created_at desc);

-- 2) Per-bruger (mine observationer)
create index if not exists idx_hazard_reports_user_created
  on public.hazard_reports (user_id, created_at desc);

-- 3) Tid (seneste først)
create index if not exists idx_hazard_reports_observed
  on public.hazard_reports (observed_at desc);

-- 4) Grov “spatial” bounding box (lat/lon) til viewport-queries
create index if not exists idx_hazard_reports_lat
  on public.hazard_reports (lat);
create index if not exists idx_hazard_reports_lon
  on public.hazard_reports (lon);

-- 5) Partial index for de synlige (kortvisning)
create index if not exists idx_hazard_reports_visible_created
  on public.hazard_reports (created_at desc)
  where status = 'visible';

------------------------------------------------------------
-- (Valgfrit) Standard-værdier for arrays
------------------------------------------------------------
alter table public.hazard_reports
  alter column photo_paths set default '{}'::text[];
