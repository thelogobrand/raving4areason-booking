-- R4AR Final Admin V2 - safe additive update
alter table public.mentors add column if not exists legal_name text;
alter table public.mentors add column if not exists artist_name text;
alter table public.mentors add column if not exists email text;
alter table public.mentors add column if not exists phone text;
alter table public.mentors add column if not exists admin_notes text;
alter table public.mentors add column if not exists dbs_checked boolean not null default false;

alter table public.members add column if not exists parent_guardian_name text;
alter table public.members add column if not exists email text;
alter table public.members add column if not exists phone text;
alter table public.members add column if not exists preferred_contact text;
alter table public.members add column if not exists mailing_consent boolean not null default false;

create table if not exists public.events (id uuid primary key default gen_random_uuid(), title text not null, event_date date not null, event_time time, location text, details text, created_at timestamptz not null default now());
alter table public.events enable row level security;
drop policy if exists "events readable" on public.events; create policy "events readable" on public.events for select using (true);
drop policy if exists "events writable" on public.events; create policy "events writable" on public.events for all using (true) with check (true);

-- Newsletter compatibility
alter table public.newsletters add column if not exists published_date date default current_date;
alter table public.newsletters add column if not exists created_at timestamptz default now();

-- Expense workflow compatibility
alter table public.expenses alter column status set default 'Submitted';
drop policy if exists "expenses updateable" on public.expenses; create policy "expenses updateable" on public.expenses for update using (true) with check (true);
