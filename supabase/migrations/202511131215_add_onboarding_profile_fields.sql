-- Add onboarding-related fields to profiles
alter table if exists public.profiles
  add column if not exists region_code text,
  add column if not exists growing_style text,
  add column if not exists onboarded_at timestamptz;
