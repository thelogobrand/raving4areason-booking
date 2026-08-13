-- R4AR combined Admin Final Pass + Accounts/Security + Messaging correction
-- Additive/idempotent. Run once in Supabase SQL Editor.

-- Admin Final Pass fields
alter table public.members add column if not exists date_joined date;
alter table public.members add column if not exists dob date;
alter table public.members add column if not exists admin_notes text;
alter table public.locations add column if not exists area text;
alter table public.locations add column if not exists phone text;
alter table public.bookings add column if not exists status text default 'Confirmed';
alter table public.bookings add column if not exists cancellation_reason text;
alter table public.bookings add column if not exists cancelled_at timestamptz;

-- News / Events schema expected by the current UI
alter table public.newsletters add column if not exists image_url text;
alter table public.events add column if not exists start_time time;
alter table public.events add column if not exists end_time time;
alter table public.events add column if not exists age_restriction text;
alter table public.events add column if not exists ticket_price text;
alter table public.events add column if not exists ticket_url text;
alter table public.events add column if not exists image_url text;

insert into storage.buckets (id,name,public) values ('newsletters','newsletters',true) on conflict (id) do update set public=true;
insert into storage.buckets (id,name,public) values ('news-events','news-events',true) on conflict (id) do update set public=true;
drop policy if exists "newsletter uploads" on storage.objects;
drop policy if exists "newsletter reads" on storage.objects;
drop policy if exists "news event uploads" on storage.objects;
drop policy if exists "news event reads" on storage.objects;
create policy "newsletter uploads" on storage.objects for insert with check (bucket_id='newsletters');
create policy "newsletter reads" on storage.objects for select using (bucket_id='newsletters');
create policy "news event uploads" on storage.objects for insert with check (bucket_id='news-events');
create policy "news event reads" on storage.objects for select using (bucket_id='news-events');

-- Private settings used only by Netlify server functions (service-role bypasses RLS)
create table if not exists public.secure_settings (
  setting_key text primary key,
  setting_value text,
  updated_at timestamptz not null default now()
);
alter table public.secure_settings enable row level security;
-- Deliberately no anon/public policies on secure_settings.

-- Ensure general app settings table exists for non-sensitive settings such as mileage rate
create table if not exists public.app_settings (
  setting_key text primary key,
  setting_value text,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "app settings readable" on public.app_settings;
create policy "app settings readable" on public.app_settings for select using (true);

insert into public.app_settings(setting_key,setting_value)
values ('mileage_rate','0.45')
on conflict(setting_key) do nothing;

-- Seed email defaults only if not already set
insert into public.secure_settings(setting_key,setting_value) values
 ('notification_email','unitypromotionsuk@gmail.com'),
 ('expense_email','unitypromotionsuk@gmail.com'),
 ('from_email','onboarding@resend.dev')
on conflict(setting_key) do nothing;
