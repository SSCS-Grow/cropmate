-- Tabel med minimal log (kan oprenses løbende)
create table if not exists public.api_rate_limits (
  id bigserial primary key,
  route text not null,
  key_id text not null,
  ts timestamptz not null default now()
);

-- Funktion: tjek + registrér request atomisk
-- Returnerer: allowed bool, remaining int
create or replace function public.check_rate_limit(
  p_route text,
  p_key_id text,
  p_limit int,
  p_window_seconds int
)
returns table (allowed boolean, remaining int)
language plpgsql
security definer
as $$
declare
  cutoff timestamptz := now() - make_interval(secs => p_window_seconds);
  used_count int;
begin
  -- Slet gamle rækker for nøjagtig tælling (valgfrit/enkelt)
  delete from public.api_rate_limits
  where route = p_route
    and key_id = p_key_id
    and ts < cutoff;

  select count(*) into used_count
  from public.api_rate_limits
  where route = p_route
    and key_id = p_key_id
    and ts >= cutoff;

  if used_count >= p_limit then
    return query select false as allowed, greatest(0, p_limit - used_count) as remaining;
  else
    insert into public.api_rate_limits (route, key_id, ts)
    values (p_route, p_key_id, now());
    return query select true as allowed, greatest(0, p_limit - (used_count+1)) as remaining;
  end if;
end;
$$;

-- Giv rettigheder til at kalde funktionen fra api (anon+authenticated)
grant execute on function public.check_rate_limit(text, text, int, int) to anon, authenticated;

-- (Bevidst ingen RLS på logtabellen; adgang går kun via security-definer funktionen)
