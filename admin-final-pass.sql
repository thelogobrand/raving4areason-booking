-- R4AR Admin Final Pass — additive only
alter table public.members add column if not exists date_joined date;
alter table public.members add column if not exists dob date;
alter table public.members add column if not exists admin_notes text;

alter table public.locations add column if not exists area text;
alter table public.locations add column if not exists phone text;

alter table public.bookings add column if not exists status text default 'Confirmed';
alter table public.bookings add column if not exists cancellation_reason text;
alter table public.bookings add column if not exists cancelled_at timestamptz;

alter table public.newsletters add column if not exists image_url text;
alter table public.events add column if not exists start_time time;
alter table public.events add column if not exists end_time time;
alter table public.events add column if not exists age_restriction text;
alter table public.events add column if not exists ticket_price text;
alter table public.events add column if not exists ticket_url text;
alter table public.events add column if not exists image_url text;

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
