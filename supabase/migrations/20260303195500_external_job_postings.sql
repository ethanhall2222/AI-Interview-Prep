create table if not exists public.external_job_postings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  external_id text not null unique,
  title text not null,
  company text not null,
  location text,
  url text not null,
  source text not null,
  snippet text,
  posted_at timestamptz,
  last_seen_at timestamptz not null default now()
);

create index if not exists external_job_postings_last_seen_idx
  on public.external_job_postings (last_seen_at desc);

alter table public.external_job_postings enable row level security;

drop policy if exists "external_job_postings_select_authenticated" on public.external_job_postings;
create policy "external_job_postings_select_authenticated"
on public.external_job_postings
for select
to authenticated
using (true);

drop policy if exists "external_job_postings_insert_authenticated" on public.external_job_postings;
create policy "external_job_postings_insert_authenticated"
on public.external_job_postings
for insert
to authenticated
with check (true);

drop policy if exists "external_job_postings_update_authenticated" on public.external_job_postings;
create policy "external_job_postings_update_authenticated"
on public.external_job_postings
for update
to authenticated
using (true)
with check (true);
