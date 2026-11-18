-- NEMO-owned records only. Provider content must follow its own license/retention terms.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  preferred_language text not null default 'en' check (char_length(preferred_language) <= 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  city text not null,
  country_code char(2) not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  cuisine_tags text[] not null default '{}',
  price_level smallint check (price_level between 1 and 4),
  source_name text not null,
  source_url text,
  source_license text not null,
  last_verified_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_evidence (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  dish_name text not null check (char_length(dish_name) between 1 and 160),
  language_code text not null default 'en',
  evidence_type text not null check (evidence_type in ('restaurant_submitted','licensed_menu','editor_verified')),
  evidence_url text,
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_places (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dish_name text not null check (char_length(dish_name) between 1 and 100),
  created_at timestamptz not null default now()
);

create unique index if not exists saved_searches_user_dish_idx
  on public.saved_searches(user_id, lower(dish_name));

create index if not exists restaurants_public_city_idx on public.restaurants(country_code, city) where is_published;
create index if not exists menu_evidence_dish_idx on public.menu_evidence using gin (to_tsvector('simple', dish_name));

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_evidence enable row level security;
alter table public.saved_places enable row level security;
alter table public.saved_searches enable row level security;

create policy "Users read their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users insert their own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Anyone can read published restaurants" on public.restaurants for select to anon, authenticated using (is_published);
create policy "Anyone can read current menu evidence for published restaurants" on public.menu_evidence for select to anon, authenticated using (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.is_published)
  and (expires_at is null or expires_at > now())
);
create policy "Users manage their own saved places" on public.saved_places for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own saved searches" on public.saved_searches for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- A profile is created automatically, without copying a password into NEMO tables.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
revoke all on function public.handle_new_user() from public, anon, authenticated;

grant select on public.restaurants, public.menu_evidence to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.saved_places, public.saved_searches to authenticated;

-- No public INSERT/UPDATE/DELETE policies for curated restaurant or menu records.
-- Manage those through a trusted ingestion process using a server-only service role.

