-- Hire Ground local schema for Supabase
-- Creates core tables used by the app and enables per-user row-level security.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  question_set text[] not null,
  answers text[] not null,
  scores jsonb not null,
  feedback text not null
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_title text not null,
  company text not null,
  job_description text not null,
  resume_summary text not null,
  focus_areas text,
  generated_output jsonb not null
);

create index if not exists sessions_user_created_at_idx
  on public.sessions (user_id, created_at desc);

create index if not exists job_applications_user_created_at_idx
  on public.job_applications (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own"
on public.sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own"
on public.sessions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "sessions_update_own" on public.sessions;
create policy "sessions_update_own"
on public.sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "job_applications_select_own" on public.job_applications;
create policy "job_applications_select_own"
on public.job_applications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "job_applications_insert_own" on public.job_applications;
create policy "job_applications_insert_own"
on public.job_applications
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "job_applications_update_own" on public.job_applications;
create policy "job_applications_update_own"
on public.job_applications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
