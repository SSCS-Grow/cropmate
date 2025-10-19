-- ==========================================
-- CropMate Analytics (observations-based)
-- Schema detected: pest_id, disease_id, lat, lng, status, created_at
-- ==========================================

-- 1) View: analytics_observations
--    - Deriverer 'type' ud fra pest_id/disease_id
--    - crop er NULL (kan udfyldes senere hvis du har kilde)
create or replace view public.analytics_observations as
select
  o.id,
  o.created_at,
  (o.created_at at time zone 'UTC')::date as observed_date,
  date_trunc('week',  o.created_at at time zone 'UTC')::date  as observed_week,
  date_trunc('month', o.created_at at time zone 'UTC')::date  as observed_month,
  case
    when o.pest_id is not null then 'pest'
    when o.disease_id is not null then 'disease'
    else 'other'
  end::text as type,
  null::text as crop,
  o.lat,
  o.lng
from public.observations o
-- justér denne WHERE hvis du ikke bruger status='approved'
where o.status = 'approved';

comment on view public.analytics_observations is
'Analytics-fladt view: type = pest/disease/other ud fra pest_id/disease_id; crop er NULL foreløbigt.';

-- 2) Materialized view: daglige counts (for hurtig tidsserie)
drop materialized view if exists public.analytics_daily_counts;
create materialized view public.analytics_daily_counts as
select observed_date, type, count(*)::bigint as count
from public.analytics_observations
group by 1,2;

create index if not exists idx_adc_date on public.analytics_daily_counts (observed_date);
create index if not exists idx_adc_type on public.analytics_daily_counts (type);

-- 3) RPC: tidsserie (dato-interval + valgfri type-filter)
create or replace function public.rpc_analytics_timeseries(
  start_date date,
  end_date   date,
  type_filter text default null,
  crop_filter text default null  -- ignoreres p.t. (crop er NULL)
)
returns table(observed_date date, count bigint)
language sql
stable
as $$
  select d.observed_date, sum(d.count)::bigint as count
  from public.analytics_daily_counts d
  where d.observed_date between start_date and end_date
    and (type_filter is null or d.type = type_filter)
  group by 1
  order by 1;
$$;

-- 4) RPC: breakdown (dimension)
--    Brug 'type' som dim. (crop er NULL; region findes ikke)
create or replace function public.rpc_analytics_breakdown(
  dim text,  -- forvent 'type'
  start_date date,
  end_date   date
)
returns table(label text, count bigint)
language plpgsql
stable
as $$
begin
  if dim not in ('type') then
    -- hvis nogen sender en anden dim, returner tomt resultat
    return;
  end if;

  return query execute format(
    'select %I::text as label, count(*)::bigint as count
     from public.analytics_observations
     where observed_date between $1 and $2
     group by 1
     order by 2 desc
     limit 20', dim)
  using start_date, end_date;
end;
$$;

-- 5) RPC: KPI'er
create or replace function public.rpc_analytics_kpis(
  start_date date,
  end_date   date
)
returns table(total bigint, unique_types bigint, unique_crops bigint, last24h bigint)
language plpgsql
stable
as $$
begin
  return query
  with base as (
    select * from public.analytics_observations
    where observed_date between start_date and end_date
  ),
  last24 as (
    select count(*)::bigint as c
    from public.analytics_observations
    where created_at >= now() - interval '24 hours'
  )
  select
    (select count(*)::bigint from base)                 as total,
    (select count(distinct type)::bigint from base)     as unique_types,
    (select count(distinct crop)::bigint from base)     as unique_crops,  -- vil være 0 indtil crop udfyldes
    (select c from last24)                              as last24h;
end;
$$;

-- 6) Refresh helper
create or replace function public.rpc_analytics_refresh()
returns void
language sql
security definer
as $$
  refresh materialized view concurrently public.analytics_daily_counts;
$$;

-- (Valgfrit) give execute-rettigheder, hvis nødvendigt:
-- grant execute on function public.rpc_analytics_timeseries(date,date,text,text) to anon, authenticated;
-- grant execute on function public.rpc_analytics_breakdown(text,date,date) to anon, authenticated;
-- grant execute on function public.rpc_analytics_kpis(date,date) to anon, authenticated;
