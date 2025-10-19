-- v0.6: strengthen relations + cascade + notes
-- Adjust table names if yours differ

-- Ensure profiles table exists and primary key is user id (uuid)
-- create table profiles if not already:
-- create table profiles (id uuid primary key, is_admin boolean default false);

-- NOTES per plant (Min Have)
create table if not exists garden_notes (
  id uuid primary key default gen_random_uuid(),
  garden_id uuid not null,
  plant_id uuid, -- optional if you model plants separate
  author_id uuid not null,
  title text,
  body text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add FK + cascade
alter table if exists observations
  drop constraint if exists observations_user_id_fkey,
  drop constraint if exists observations_garden_id_fkey,
  drop constraint if exists observations_pest_id_fkey,
  drop constraint if exists observations_disease_id_fkey;

alter table observations
  add constraint observations_user_id_fkey
    foreign key (user_id) references profiles(id) on delete set null,
  add constraint observations_garden_id_fkey
    foreign key (garden_id) references gardens(id) on delete cascade,
  add constraint observations_pest_id_fkey
    foreign key (pest_id) references pests(id) on delete set null,
  add constraint observations_disease_id_fkey
    foreign key (disease_id) references diseases(id) on delete set null;

-- FK for garden_notes
alter table garden_notes
  add constraint garden_notes_garden_id_fkey
    foreign key (garden_id) references gardens(id) on delete cascade,
  add constraint garden_notes_author_id_fkey
    foreign key (author_id) references profiles(id) on delete cascade;

-- Optional helpful indexes
create index if not exists idx_observations_created_at on observations(created_at desc);
create index if not exists idx_observations_location on observations(geom) where geom is not null;
create index if not exists idx_garden_notes_garden on garden_notes(garden_id);
