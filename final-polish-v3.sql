-- Raving 4 A Reason - Final Polish V3
-- Safe additive update. Existing records are not deleted.

alter table public.newsletters add column if not exists image_url text;

alter table public.events add column if not exists start_time time;
alter table public.events add column if not exists end_time time;
alter table public.events add column if not exists age_restriction text;
alter table public.events add column if not exists ticket_price text;
alter table public.events add column if not exists ticket_url text;
alter table public.events add column if not exists image_url text;

create table if not exists public.mailing_list (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null unique,
  consent boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.mailing_list enable row level security;
drop policy if exists "mailing list readable" on public.mailing_list;
drop policy if exists "mailing list insertable" on public.mailing_list;
drop policy if exists "mailing list updateable" on public.mailing_list;
create policy "mailing list readable" on public.mailing_list for select using (true);
create policy "mailing list insertable" on public.mailing_list for insert with check (true);
create policy "mailing list updateable" on public.mailing_list for update using (true) with check (true);

insert into storage.buckets (id,name,public) values ('newsletters','newsletters',true)
on conflict (id) do update set public=true;
insert into storage.buckets (id,name,public) values ('news-events','news-events',true)
on conflict (id) do update set public=true;

drop policy if exists "newsletter uploads" on storage.objects;
drop policy if exists "newsletter reads" on storage.objects;
drop policy if exists "news event uploads" on storage.objects;
drop policy if exists "news event reads" on storage.objects;
create policy "newsletter uploads" on storage.objects for insert with check (bucket_id='newsletters');
create policy "newsletter reads" on storage.objects for select using (bucket_id='newsletters');
create policy "news event uploads" on storage.objects for insert with check (bucket_id='news-events');
create policy "news event reads" on storage.objects for select using (bucket_id='news-events');

-- Settings used by Netlify server functions. Do not expose secret hashes to the browser.
create table if not exists public.secure_settings (
  setting_key text primary key,
  setting_value text not null,
  updated_at timestamptz not null default now()
);
alter table public.secure_settings enable row level security;
-- Intentionally no public policies on secure_settings.
