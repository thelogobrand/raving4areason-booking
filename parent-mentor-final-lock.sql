-- R4AR Parent + Mentor Final Lock
-- Safe additive update: does not delete existing bookings or mailing contacts.

alter table public.bookings add column if not exists booking_ref text;
create unique index if not exists bookings_booking_ref_unique
  on public.bookings (booking_ref) where booking_ref is not null;

alter table public.mailing_list add column if not exists first_name text;
alter table public.mailing_list add column if not exists surname text;
alter table public.mailing_list add column if not exists child_member_name text;
alter table public.mailing_list add column if not exists source text;
alter table public.mailing_list add column if not exists updated_at timestamptz not null default now();

-- Ensure email is the duplicate-protection key for mailing-list opt-ins.
create unique index if not exists mailing_list_email_unique_ci
  on public.mailing_list (lower(email));
