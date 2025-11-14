-- Ensure pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- Create table only if missing (won't change existing table)
create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  -- Keep the core columns minimal here to avoid conflicts with existing schema.
  created_at timestamptz not null default now()
);

-- Enable RLS (safe to repeat)
alter table public.observations enable row level security;
