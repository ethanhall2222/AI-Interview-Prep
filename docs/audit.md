# Audit Report (March 5, 2026)

## Route inventory
- `/`
- `/about`
- `/admin/jobs`
- `/admin/login`
- `/dashboard`
- `/dashboard/[id]`
- `/history`
- `/interview-prep`
- `/jobs`
- `/jobs/portal`
- `/login`
- `/practice`
- `/privacy`
- `/resume-review`
- `/tracker`

## Reproduction findings

### 1) `/dashboard` 500 in production-like path
- **Observed error (server runtime):**
  - `TypeError: nextCookies.get is not a function`
  - `Route "/dashboard" used searchParams.latest. searchParams should be awaited before using its properties.`
- **Root causes:**
  - Next.js 16 dynamic APIs changed cookie and searchParams behavior.
  - Existing auth helper package usage was not resilient under Next 16.
  - `searchParams` was accessed synchronously.
  - Production bypass bug: `isDevModeBypass()` returned true when `VERCEL=1`, creating null session/supabase states in production.
- **Fixes shipped:**
  - Removed `VERCEL` from dev bypass logic.
  - Updated server pages to await `searchParams` promise contract.
  - Added safe guest state on dashboard when session is absent.
  - Added `app/dashboard/error.tsx` and `app/dashboard/loading.tsx` for resilient UX.

### 2) `/jobs` stuck on loading / hangs
- **Observed behavior:**
  - Prior flow could remain in loading state with weak recovery when network failed.
- **Root causes:**
  - No request timeout for `/api/job-helper`.
  - No retry-oriented error panel.
  - Fragile prefill/searchParams path under Next 16 sync usage.
- **Fixes shipped:**
  - Added `AbortController` timeout and explicit failure messaging.
  - Added retry CTA with attempt counter.
  - Added manual fallback guidance so user can proceed without backend success.
  - Converted `app/jobs/page.tsx` to awaited `searchParams` handling.

### 3) `/practice` mic warning quality
- **Observed behavior:**
  - Generic mic warning with no mode fallback and weak permission clarity.
- **Root causes:**
  - No explicit mode model and no permission-state UX.
- **Fixes shipped:**
  - Added `Voice mode` and `Type mode` toggle.
  - Added browser capability checks (`MediaRecorder`, speech API).
  - Added permission state display and guidance.
  - Added graceful default to Type mode when voice is unsupported.

## Missing env vars and safe local defaults
Required for full Supabase persistence:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional but useful:
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `JOB_SOURCE_URLS`
- `LEVER_COMPANIES`
- `ARBEITNOW_MAX_PAGES`
- `AIRTABLE_PAT`
- `AIRTABLE_BASE_ID`

Safe local behavior implemented:
- In non-production (`NODE_ENV !== production`) or explicit `NEXT_PUBLIC_DEV_MODE=1`, session helpers return a safe stub to allow UI development.
- In production, auth bypass no longer triggers from Vercel runtime env.

## Data flow (short)
- Landing routes users into Job Lab, Resume Review, Practice, and Tracker.
- Job Lab calls `/api/job-helper` and now handles timeout/failure with clear fallback.
- Resume Review runs deterministic local analysis (`lib/resume-review.ts`) for section extraction, keyword analysis, bullet quality checks, ATS warnings, and rewrites.
- Practice calls `/api/questions`, `/api/transcribe`, `/api/analyze`, and `/api/eval` with mode-aware voice/type UX.
- Tracker persists local entries to `localStorage`; portal sync uses `/api/jobs/sync` and Supabase/Airtable storage.
