-- Raving 4 A Reason – Stage 1 Members + Dashboard
-- Run this once in Supabase: SQL Editor → New query → Run

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dj_mc_name text,
  type text not null check (
    type in (
      'Lessons Paid',
      'Lessons Funded',
      'Membership',
      'Part Funded',
      'Other'
    )
  ),
  created_at timestamptz not null default now()
);

-- Add the new fields safely if an older members table already exists.
alter table public.members add column if not exists name text;
alter table public.members add column if not exists dj_mc_name text;
alter table public.members add column if not exists type text;
alter table public.members add column if not exists created_at timestamptz default now();

alter table public.members enable row level security;

-- Match the current app's public frontend access.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'members'
      and policyname = 'members readable'
  ) then
    create policy "members readable"
      on public.members for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'members'
      and policyname = 'members insertable'
  ) then
    create policy "members insertable"
      on public.members for insert
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'members'
      and policyname = 'members updateable'
  ) then
    create policy "members updateable"
      on public.members for update
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'members'
      and policyname = 'members deletable'
  ) then
    create policy "members deletable"
      on public.members for delete
      using (true);
  end if;
end $$;
