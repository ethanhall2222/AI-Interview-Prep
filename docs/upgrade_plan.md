# Upgrade Plan

## Target UX
Primary funnel:
- Landing -> Job Description input -> Resume Review -> Output package -> Interview Prep

Secondary support:
- Tracker for application pipeline management
- Existing pages stay intact and are improved, not removed

## Component Map

### Reuse
- `components/Button.tsx` for all CTAs and action buttons
- `components/ToastProvider.tsx` for user feedback
- Existing layout/nav in `app/layout.tsx`
- Existing job generation card style patterns from `app/jobs/jobs-client.tsx`

### Add
- `app/resume-review/page.tsx` + `resume-review-client.tsx`
- `app/interview-prep/page.tsx` + config-driven prep components
- `app/tracker/page.tsx` + client localStorage table/filter UI
- Shared helpers under `lib/`:
  - resume parsing heuristics
  - resume-vs-JD analysis logic
  - interview question bank config

## Data Model

### Resume Analysis (client/server-safe model)
- `resumeText: string`
- `jobDescriptionText: string`
- `parsedSections: { summary, experience, education, skills, projects, other }`
- `issues: string[]`
- `keywordGaps: string[]`
- `rewriteSuggestions: Array<{ original: string; improved: string; why: string }>`
- `atsWarnings: string[]`

### JD Analysis
- keywords extracted from JD using normalized token heuristics
- ranked by frequency and meaningfulness (length/stop-word filtering)

### Tracker Entry
- `id, company, role, link, status, appliedDate, notes, updatedAt`
- persistence: `localStorage` key in first iteration

## API Plan
- Keep existing APIs untouched for backward compatibility.
- Add optional API endpoint for resume analysis only if needed.
- Initial resume analysis can run client-side with deterministic heuristics.
- Preserve server/client separation for network actions and auth-bound operations.

## Acceptance Criteria
- [x] Landing guides users into the new funnel with clear CTAs.
- [x] `/resume-review` exists and supports paste resume + JD input.
- [x] Resume review outputs issues, keyword gaps, rewrites, ATS warnings.
- [x] Before/After cards + copy actions work.
- [x] `/interview-prep` exists with role-type selector and structured question bank.
- [x] Mock interview timed mode and rubric display exist.
- [x] `/tracker` exists with CRUD-lite add/filter/status flow via localStorage.
- [x] Error/loading states improved on key pages.
- [x] Basic accessibility improvements applied (labels/focus/ARIA/headings).
- [x] Tests cover resume analysis + keyword gap render.
- [x] `/docs/demo.md` created with 2-minute interview script.

## Dependency Note
- No new runtime dependencies planned initially.
- Use existing stack (Next.js, React, Tailwind, zod, vitest) for maintainability.
