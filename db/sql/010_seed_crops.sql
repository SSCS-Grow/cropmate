-- 010_seed_crops.sql
-- Seed of common crops for public catalog
-- Safe to run multiple times (UPSERT on slug)

begin;

-- Ensure slug uniqueness (should already exist, but keep idempotent)
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'crops_slug_key'
  ) then
    alter table public.crops
      add constraint crops_slug_key unique (slug);
  end if;
end$$;

insert into public.crops (id, slug, name_da, name_en, category, description, created_at)
values
  (gen_random_uuid(),'tomat','Tomat','Tomato','vegetable','Varmekrævende plante; trives bedst i læ og med støtte.', now()),
  (gen_random_uuid(),'agurk','Agurk','Cucumber','vegetable','Kræver jævn vanding og varme; god i drivhus.', now()),
  (gen_random_uuid(),'peberfrugt','Peberfrugt','Bell pepper','vegetable','Lun placering; lang udviklingstid.', now()),
  (gen_random_uuid(),'chilifrugt','Chili','Chili pepper','vegetable','Mange sorter; kræver varme og lys.', now()),
  (gen_random_uuid(),'kartoffel','Kartoffel','Potato','vegetable','Knolde; forspiring giver tidligere høst.', now()),
  (gen_random_uuid(),'gulerod','Gulerod','Carrot','vegetable','Direkte sås; løs jord giver pæne rødder.', now()),
  (gen_random_uuid(),'roe-bede','Rødbede','Beetroot','vegetable','Tåler kulde; kan sås tidligt.', now()),
  (gen_random_uuid(),'løg','Løg','Onion','vegetable','Sættes fra sætteløg; kræver sol.', now()),
  (gen_random_uuid(),'hvidløg','Hvidløg','Garlic','vegetable','Sættes ofte i efteråret for stor høst.', now()),
  (gen_random_uuid(),'salat','Salat','Lettuce','vegetable','Hurtig afgrøde; så i hold for løbende høst.', now()),
  (gen_random_uuid(),'spinat','Spinat','Spinach','vegetable','Trives i køligt vejr; kan gå i stok ved varme.', now()),
  (gen_random_uuid(),'kale','Grønkål','Kale','vegetable','Robust; smagen forbedres af frost.', now()),
  (gen_random_uuid(),'squash','Squash','Zucchini','vegetable','Kraftig plante; kræver plads og vand.', now()),
  (gen_random_uuid(),'jordbær','Jordbær','Strawberry','fruit','Flerårig; deling/nyplantning hver 3.-4. år.', now()),
  (gen_random_uuid(),'æble','Æble','Apple','fruit','Frugttræ; beskæring og bestøvning er vigtige.', now()),
  (gen_random_uuid(),'pære','Pære','Pear','fruit','Kræver sol og veldrænet jord; beskæring årligt.', now()),
  (gen_random_uuid(),'solbær','Solbær','Blackcurrant','fruit','Busk; beskæring af ældre grene giver udbytte.', now()),
  (gen_random_uuid(),'basilikum','Basilikum','Basil','herb','Varmeelskende urt; vil ikke have kolde rødder.', now()),
  (gen_random_uuid(),'persille','Persille','Parsley','herb','Spirer langsomt; kan overvintre mildt.', now()),
  (gen_random_uuid(),'timian','Timian','Thyme','herb','Tørketålende; trives i veldrænet jord.', now())
on conflict (slug) do update
set
  name_da    = excluded.name_da,
  name_en    = excluded.name_en,
  category   = excluded.category,
  description= excluded.description;

commit;
