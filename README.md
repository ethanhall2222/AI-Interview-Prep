# Hire Ground

WVU-themed interview prep and job application tracker built with Next.js + Supabase.

## Run App

```bash
pnpm install
pnpm dev
```

App runs at `http://localhost:3000` by default (or next available port).

## Free Local Supabase Setup (Auth + Magic Link + DB)

This project includes local migrations under `supabase/migrations` for:
- `profiles`
- `sessions`
- `job_applications`

### 1) Install prerequisites
- Docker Desktop
- Supabase CLI

### 2) Start local Supabase

```bash
supabase start
```

### 3) Copy local env values

```bash
supabase status -o env
```

Copy those values into `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Set:
- `NEXT_PUBLIC_APP_URL` to your current app URL (example: `http://localhost:3001`)
- `ADMIN_EMAILS` to your admin email list

### 4) Apply migrations

If the DB is fresh, migrations are applied on `supabase start`.
If needed, run:

```bash
supabase db reset
```

### 5) Magic-link email inbox (local)

Supabase local includes an email catcher UI.
After `supabase start`, run:

```bash
supabase status
```

Open the `Inbucket` URL shown there, then click the magic link email.

### 6) Auth redirect URL

Use:
- `http://localhost:3000/auth/callback`
- or your active port, e.g. `http://localhost:3001/auth/callback`

The login form now uses the browser origin automatically, so it works on non-3000 ports.

## Airtable Job Scrape Pipeline

Add these variables to `.env.local`:
- `AIRTABLE_PAT`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_NAME` (default: `JobPostings`)
- `JOB_SOURCE_URLS` (newline or comma-separated source URLs, prefer Lever/Ashby role pages)

If Airtable is not configured, the app automatically stores scraped postings in local
Supabase table `external_job_postings`.

Create an Airtable table with fields:
- `Title` (single line text)
- `Company` (single line text)
- `Location` (single line text)
- `URL` (url)
- `Source` (url or text)
- `Snippet` (long text)
- `PostedAt` (date/time)
- `ExternalId` (single line text)
- `LastSeenAt` (date/time)

Run sync from:
- `POST /api/jobs/sync` (admin-only)
- Or use the Admin Jobs page button at `/admin/jobs`.

Tracked users can view synced postings at:
- `/jobs/portal`
