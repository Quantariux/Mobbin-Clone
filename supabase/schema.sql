-- Loupe schema — run this as-is in the Supabase SQL editor.
-- ============================================================
create extension if not exists pgcrypto;

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table screen_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tagline text,
  icon_url text,
  platform text[] not null default '{}',
  rating numeric(2,1),
  review_count int not null default 0,
  website_url text,
  created_at timestamptz not null default now()
);

create table app_categories (
  app_id uuid not null references apps(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (app_id, category_id)
);

create table screens (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references apps(id) on delete cascade,
  image_url text not null,
  platform text not null,
  is_highlight boolean not null default false,
  created_at timestamptz not null default now()
);

create table screen_screen_types (
  screen_id uuid not null references screens(id) on delete cascade,
  screen_type_id uuid not null references screen_types(id) on delete cascade,
  primary key (screen_id, screen_type_id)
);

create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Collection',
  created_at timestamptz not null default now()
);

create table collection_screens (
  collection_id uuid not null references collections(id) on delete cascade,
  screen_id uuid not null references screens(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, screen_id)
);

create index idx_screens_app_id on screens(app_id);
create index idx_app_categories_category_id on app_categories(category_id);
create index idx_screen_screen_types_screen_type_id on screen_screen_types(screen_type_id);
create index idx_collection_screens_screen_id on collection_screens(screen_id);

alter table apps enable row level security;
alter table categories enable row level security;
alter table screen_types enable row level security;
alter table app_categories enable row level security;
alter table screens enable row level security;
alter table screen_screen_types enable row level security;
alter table collections enable row level security;
alter table collection_screens enable row level security;

create policy "public read apps" on apps for select using (true);
create policy "public read categories" on categories for select using (true);
create policy "public read screen_types" on screen_types for select using (true);
create policy "public read app_categories" on app_categories for select using (true);
create policy "public read screens" on screens for select using (true);
create policy "public read screen_screen_types" on screen_screen_types for select using (true);

create policy "users manage own collections" on collections
  for all using (auth.uid() = user_id);

create policy "users manage own collection_screens" on collection_screens
  for all using (
    exists (
      select 1 from collections c
      where c.id = collection_screens.collection_id
      and c.user_id = auth.uid()
    )
  );
-- ============================================================
