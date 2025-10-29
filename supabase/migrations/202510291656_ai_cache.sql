-- AI-diagnose cache (key/value)
create table if not exists public.ai_cache (
  cache_key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- RLS slået FRA (vi kalder via security-definerede funktioner)
alter table public.ai_cache disable row level security;

-- GET: returnér value hvis ikke udløbet, ellers null
create or replace function public.ai_cache_get(p_key text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v jsonb;
begin
  select value into v
  from public.ai_cache
  where cache_key = p_key
    and expires_at > now();
  return v;
end;
$$;

-- SET: skriv/overskriv med TTL i sekunder
create or replace function public.ai_cache_set(p_key text, p_value jsonb, p_ttl_seconds int)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.ai_cache (cache_key, value, expires_at)
  values (p_key, p_value, now() + make_interval(secs => p_ttl_seconds))
  on conflict (cache_key) do update
    set value = excluded.value,
        expires_at = excluded.expires_at,
        created_at = now();
end;
$$;

grant execute on function public.ai_cache_get(text) to anon, authenticated;
grant execute on function public.ai_cache_set(text, jsonb, int) to anon, authenticated;

-- (valgfrit) oprydning af udløbne rows kan køres lejlighedsvis:
-- delete from public.ai_cache where expires_at < now();
