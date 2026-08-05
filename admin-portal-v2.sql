-- R4AR Admin Portal V2 additions (safe/idempotent)
alter table public.mentors add column if not exists artist_name text;
alter table public.mentors add column if not exists phone text;
alter table public.mentors add column if not exists admin_notes text;
alter table public.mentors add column if not exists dbs_checked boolean not null default false;
alter table public.mentors add column if not exists password_hash text;

create table if not exists public.app_settings (
  setting_key text primary key,
  setting_value text,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "app settings readable" on public.app_settings;
create policy "app settings readable" on public.app_settings for select using (true);
drop policy if exists "app settings writable" on public.app_settings;
create policy "app settings writable" on public.app_settings for all using (true) with check (true);

create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  published_date date not null default current_date,
  file_url text not null,
  created_at timestamptz not null default now()
);
alter table public.newsletters enable row level security;
drop policy if exists "newsletters readable" on public.newsletters;
create policy "newsletters readable" on public.newsletters for select using (true);
drop policy if exists "newsletters writable" on public.newsletters;
create policy "newsletters writable" on public.newsletters for all using (true) with check (true);
