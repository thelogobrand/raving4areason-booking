-- Raving 4 A Reason Stage 2
create extension if not exists pgcrypto;

alter table public.bookings add column if not exists booking_reference text;
update public.bookings
set booking_reference = 'R4AR-' || extract(year from coalesce(created_at, now()))::int || '-' || lpad((floor(random()*1000000))::int::text, 6, '0')
where booking_reference is null;
create unique index if not exists bookings_booking_reference_key on public.bookings(booking_reference);

alter table public.bookings add column if not exists manage_token uuid default gen_random_uuid();
update public.bookings set manage_token = gen_random_uuid() where manage_token is null;
create unique index if not exists bookings_manage_token_key on public.bookings(manage_token);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_role text not null check (sender_role in ('parent','mentor','admin')),
  sender_name text not null,
  recipient_scope text not null check (recipient_scope in ('parent','mentor','admin','both')),
  body text not null check (char_length(body) between 1 and 3000),
  read_by_parent boolean not null default false,
  read_by_mentor boolean not null default false,
  read_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_booking_id_created_at_idx on public.messages(booking_id,created_at);

create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  published_date date not null,
  storage_path text not null unique,
  file_url text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;
alter table public.newsletters enable row level security;

do $$ begin
  create policy "messages readable" on public.messages for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "messages insertable" on public.messages for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "messages updateable" on public.messages for update using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "messages deletable" on public.messages for delete using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "newsletters readable" on public.newsletters for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "newsletters insertable" on public.newsletters for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "newsletters deletable" on public.newsletters for delete using (true);
exception when duplicate_object then null; end $$;

insert into storage.buckets (id,name,public)
values ('newsletters','newsletters',true)
on conflict (id) do update set public=true;

do $$ begin
  create policy "newsletter files public read" on storage.objects for select using (bucket_id='newsletters');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "newsletter files upload" on storage.objects for insert with check (bucket_id='newsletters');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "newsletter files delete" on storage.objects for delete using (bucket_id='newsletters');
exception when duplicate_object then null; end $$;

-- Stage 2.1 secure changeable portal passwords.
-- This table is intentionally NOT readable through the public/anon API.
create table if not exists public.portal_credentials (
  credential_key text primary key,
  password_hash text not null,
  updated_at timestamptz not null default now()
);
alter table public.portal_credentials enable row level security;
-- No anon policies: only the Netlify function using the service-role key can access it.
