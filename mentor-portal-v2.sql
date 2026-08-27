-- Raving 4 A Reason: Mentor Portal V2 update
-- Safe additive update. Existing records are not deleted.

alter table public.bookings
  add column if not exists notes text;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null,
  mentor text not null,
  child_name text,
  sender_name text,
  recipient text not null check (recipient in ('mentor','parent','admin','both')),
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text not null,
  published_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  mentor text not null,
  expense_type text not null check (expense_type in ('mileage','receipt')),
  expense_date date not null,
  miles numeric,
  amount numeric,
  category text,
  reason text not null,
  receipt_url text,
  status text not null default 'Submitted',
  mentor_display_name text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;
alter table public.newsletters enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "messages readable" on public.messages;
drop policy if exists "messages insertable" on public.messages;
drop policy if exists "messages updateable" on public.messages;
create policy "messages readable" on public.messages for select using (true);
create policy "messages insertable" on public.messages for insert with check (true);
create policy "messages updateable" on public.messages for update using (true) with check (true);

drop policy if exists "newsletters readable" on public.newsletters;
create policy "newsletters readable" on public.newsletters for select using (true);

drop policy if exists "expenses readable" on public.expenses;
drop policy if exists "expenses insertable" on public.expenses;
create policy "expenses readable" on public.expenses for select using (true);
create policy "expenses insertable" on public.expenses for insert with check (true);

insert into storage.buckets (id, name, public)
values ('expense-receipts', 'expense-receipts', true)
on conflict (id) do update set public = true;

drop policy if exists "expense receipt uploads" on storage.objects;
drop policy if exists "expense receipt reads" on storage.objects;
create policy "expense receipt uploads"
on storage.objects for insert
with check (bucket_id = 'expense-receipts');

create policy "expense receipt reads"
on storage.objects for select
using (bucket_id = 'expense-receipts');


-- Mentor profile additions
alter table public.mentors add column if not exists artist_name text;
alter table public.mentors add column if not exists profile_image_url text;
alter table public.mentors add column if not exists password_hash text;

insert into storage.buckets (id, name, public)
values ('mentor-profile-images', 'mentor-profile-images', true)
on conflict (id) do update set public = true;

drop policy if exists "mentor profile image uploads" on storage.objects;
drop policy if exists "mentor profile image reads" on storage.objects;
create policy "mentor profile image uploads"
on storage.objects for insert
with check (bucket_id = 'mentor-profile-images');

create policy "mentor profile image reads"
on storage.objects for select
using (bucket_id = 'mentor-profile-images');

-- Allow profile image replacement
drop policy if exists "mentor profile image updates" on storage.objects;
create policy "mentor profile image updates"
on storage.objects for update
using (bucket_id = 'mentor-profile-images')
with check (bucket_id = 'mentor-profile-images');


-- Final expense workflow additions
alter table public.expenses add column if not exists mentor_display_name text;
alter table public.expenses add column if not exists paid_at timestamptz;
alter table public.expenses alter column status set default 'Submitted';

update public.expenses
set status = 'Submitted'
where status is null or status = 'Pending';

drop policy if exists "expenses updateable" on public.expenses;
create policy "expenses updateable"
on public.expenses for update
using (true)
with check (true);
