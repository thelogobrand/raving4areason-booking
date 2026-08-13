-- R4AR Admin News & Events repair
-- Safe/idempotent. Run once in Supabase SQL Editor.

-- Ensure newsletter columns expected by the current app exist.
alter table public.newsletters add column if not exists published_date date default current_date;
alter table public.newsletters add column if not exists image_url text;
alter table public.newsletters add column if not exists created_at timestamptz default now();

-- Ensure events table / columns expected by the current app exist.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  location text,
  details text,
  created_at timestamptz not null default now()
);
alter table public.events add column if not exists start_time time;
alter table public.events add column if not exists end_time time;
alter table public.events add column if not exists age_restriction text;
alter table public.events add column if not exists ticket_price text;
alter table public.events add column if not exists ticket_url text;
alter table public.events add column if not exists image_url text;
alter table public.events add column if not exists location text;
alter table public.events add column if not exists details text;
alter table public.events add column if not exists created_at timestamptz default now();

alter table public.newsletters enable row level security;
alter table public.events enable row level security;

drop policy if exists "newsletters readable" on public.newsletters;
drop policy if exists "newsletters insertable" on public.newsletters;
drop policy if exists "newsletters writable" on public.newsletters;
create policy "newsletters readable" on public.newsletters for select using (true);
create policy "newsletters insertable" on public.newsletters for insert with check (true);

drop policy if exists "events readable" on public.events;
drop policy if exists "events insertable" on public.events;
drop policy if exists "events writable" on public.events;
create policy "events readable" on public.events for select using (true);
create policy "events insertable" on public.events for insert with check (true);

-- Public storage buckets used by newsletter files / cover images / event images.
insert into storage.buckets (id,name,public)
values ('newsletters','newsletters',true)
on conflict (id) do update set public=true;

insert into storage.buckets (id,name,public)
values ('news-events','news-events',true)
on conflict (id) do update set public=true;

drop policy if exists "newsletter uploads" on storage.objects;
drop policy if exists "newsletter reads" on storage.objects;
drop policy if exists "news event uploads" on storage.objects;
drop policy if exists "news event reads" on storage.objects;
create policy "newsletter uploads" on storage.objects for insert with check (bucket_id='newsletters');
create policy "newsletter reads" on storage.objects for select using (bucket_id='newsletters');
create policy "news event uploads" on storage.objects for insert with check (bucket_id='news-events');
create policy "news event reads" on storage.objects for select using (bucket_id='news-events');

-- Force PostgREST to refresh its schema cache after adding image_url/published_date.
notify pgrst, 'reload schema';
