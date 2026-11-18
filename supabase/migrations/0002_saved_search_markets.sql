-- Keep saved searches scoped to the selected country/capital as NEMO expands.
alter table public.saved_searches
  add column if not exists country_code char(2) not null default 'IE',
  add column if not exists city text not null default 'Dublin';

alter table public.saved_searches
  add constraint saved_searches_country_code_format
  check (country_code::text ~ '^[A-Z]{2}$');

drop index if exists public.saved_searches_user_dish_idx;
create unique index if not exists saved_searches_user_dish_market_idx
  on public.saved_searches(user_id, lower(dish_name), country_code, lower(city));
