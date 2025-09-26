-- 040_pest_disease_library.sql
-- Pest/Disease library + relations to crops and hazard reports
-- Idempotent: safe to re-run

------------------------------------------------------------
-- Enums (hvis du vil kategorisere yderligere)
------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pathogen_type') then
    create type pathogen_type as enum ('fungus','bacteria','virus','oomycete','nematode','physiological','other');
  end if;
end$$;

------------------------------------------------------------
-- Pests (skadedyr) & Diseases (sygdomme)
------------------------------------------------------------
create table if not exists public.pests (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name_da      text not null,
  name_en      text,
  category     text,                 -- fx 'insect','mite','slug','rodent'...
  description  text,
  symptoms     text,                 -- typiske skader/tegn
  control      text,                 -- forebyggelse/bekæmpelse
  created_at   timestamptz not null default now()
);

create table if not exists public.diseases (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name_da        text not null,
  name_en        text,
  pathogen       pathogen_type,      -- valgfri enum
  description    text,
  symptoms       text,
  control        text,
  created_at     timestamptz not null default now()
);

------------------------------------------------------------
-- Relationer til crops (admin vedligeholder)
------------------------------------------------------------
create table if not exists public.pest_crops (
  pest_id  uuid not null references public.pests(id) on delete cascade,
  crop_id  uuid not null references public.crops(id) on delete cascade,
  primary key (pest_id, crop_id)
);

create table if not exists public.disease_crops (
  disease_id uuid not null references public.diseases(id) on delete cascade,
  crop_id    uuid not null references public.crops(id) on delete cascade,
  primary key (disease_id, crop_id)
);

------------------------------------------------------------
-- Relationer til hazard_reports (brugere kan tagge egne observationer)
-- En observation kan have 0..N pests/diseases, og samme pest/disease kan gå igen
------------------------------------------------------------
create table if not exists public.hazard_report_pests (
  hazard_id uuid not null references public.hazard_reports(id) on delete cascade,
  pest_id   uuid not null references public.pests(id) on delete restrict,
  user_id   uuid not null references auth.users(id) on delete cascade, -- af hensyn til RLS (ownership)
  created_at timestamptz not null default now(),
  primary key (hazard_id, pest_id)
);

create table if not exists public.hazard_report_diseases (
  hazard_id uuid not null references public.hazard_reports(id) on delete cascade,
  disease_id uuid not null references public.diseases(id) on delete restrict,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (hazard_id, disease_id)
);

------------------------------------------------------------
-- Indexes
------------------------------------------------------------
create index if not exists idx_pests_slug on public.pests (slug);
create index if not exists idx_diseases_slug on public.diseases (slug);

create index if not exists idx_pest_crops_pest on public.pest_crops (pest_id);
create index if not exists idx_pest_crops_crop on public.pest_crops (crop_id);

create index if not exists idx_disease_crops_dis on public.disease_crops (disease_id);
create index if not exists idx_disease_crops_crop on public.disease_crops (crop_id);

create index if not exists idx_hr_pests_hazard on public.hazard_report_pests (hazard_id);
create index if not exists idx_hr_pests_pest on public.hazard_report_pests (pest_id);

create index if not exists idx_hr_diseases_hazard on public.hazard_report_diseases (hazard_id);
create index if not exists idx_hr_diseases_dis on public.hazard_report_diseases (disease_id);

------------------------------------------------------------
-- RLS
------------------------------------------------------------
alter table public.pests                     enable row level security;
alter table public.diseases                  enable row level security;
alter table public.pest_crops                enable row level security;
alter table public.disease_crops             enable row level security;
alter table public.hazard_report_pests       enable row level security;
alter table public.hazard_report_diseases    enable row level security;

-- Admin predicate: exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)

-- 1) Pests/Diseases: public read; admin write
drop policy if exists pests_public_read on public.pests;
create policy pests_public_read
on public.pests
for select using ( true );

drop policy if exists pests_admin_write on public.pests;
create policy pests_admin_write
on public.pests
for all
using ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) )
with check ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) );

drop policy if exists diseases_public_read on public.diseases;
create policy diseases_public_read
on public.diseases
for select using ( true );

drop policy if exists diseases_admin_write on public.diseases;
create policy diseases_admin_write
on public.diseases
for all
using ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) )
with check ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) );

-- 2) pest_crops / disease_crops: public read (ufølsomt), admin write
drop policy if exists pest_crops_public_read on public.pest_crops;
create policy pest_crops_public_read
on public.pest_crops
for select using ( true );

drop policy if exists pest_crops_admin_write on public.pest_crops;
create policy pest_crops_admin_write
on public.pest_crops
for all
using ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) )
with check ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) );

drop policy if exists disease_crops_public_read on public.disease_crops;
create policy disease_crops_public_read
on public.disease_crops
for select using ( true );

drop policy if exists disease_crops_admin_write on public.disease_crops;
create policy disease_crops_admin_write
on public.disease_crops
for all
using ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) )
with check ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) );

-- 3) Tagging af observationer:
--    - SELECT: tillad alle (det er ufølsomme links)
--    - INSERT/DELETE: kun ejer af hazard (eller admin)
--    - WITH CHECK: user_id skal være auth.uid()
drop policy if exists hr_pests_public_read on public.hazard_report_pests;
create policy hr_pests_public_read
on public.hazard_report_pests
for select using ( true );

drop policy if exists hr_pests_write_owner_or_admin on public.hazard_report_pests;
create policy hr_pests_write_owner_or_admin
on public.hazard_report_pests
for all
using (
  exists (select 1 from public.hazard_reports h
          where h.id = hazard_id
            and (h.user_id = auth.uid()
                 or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)))
)
with check (
  user_id = auth.uid()
  and exists (select 1 from public.hazard_reports h
              where h.id = hazard_id
                and (h.user_id = auth.uid()
                     or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)))
);

drop policy if exists hr_diseases_public_read on public.hazard_report_diseases;
create policy hr_diseases_public_read
on public.hazard_report_diseases
for select using ( true );

drop policy if exists hr_diseases_write_owner_or_admin on public.hazard_report_diseases;
create policy hr_diseases_write_owner_or_admin
on public.hazard_report_diseases
for all
using (
  exists (select 1 from public.hazard_reports h
          where h.id = hazard_id
            and (h.user_id = auth.uid()
                 or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)))
)
with check (
  user_id = auth.uid()
  and exists (select 1 from public.hazard_reports h
              where h.id = hazard_id
                and (h.user_id = auth.uid()
                     or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)))
);

------------------------------------------------------------
-- Data hygiene / helpers (valgfrit)
------------------------------------------------------------
-- Lowercase slugs automatisk (simpelt – kan udvides til at erstatte mellemrum m.m.)
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'slug_lowercase') then
    create or replace function public.slug_lowercase() returns trigger
    language plpgsql as $fn$
    begin
      if new.slug is not null then
        new.slug := lower(new.slug);
      end if;
      return new;
    end;
    $fn$;
  end if;
end$$;

drop trigger if exists trg_pests_slug_lower on public.pests;
create trigger trg_pests_slug_lower
before insert or update on public.pests
for each row execute procedure public.slug_lowercase();

drop trigger if exists trg_diseases_slug_lower on public.diseases;
create trigger trg_diseases_slug_lower
before insert or update on public.diseases
for each row execute procedure public.slug_lowercase();
