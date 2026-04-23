# Agency Continuous Building

Hire Ground now adapts the role-based architecture from
`https://github.com/msitarzewski/agency-agents` into a local product operating
model.

## What Changed

The app has a typed agent roster in `lib/agency-agents.ts` and an admin command
center at `/admin/agents`.

The roster is not a background worker runtime. It is a build system for product
iteration: each role owns a lane, has defined inputs and outputs, and creates a
handoff to the next lane.

The repo also has a scheduled GitHub Actions workflow:
`.github/workflows/agency-continuous-build.yml`.

That workflow runs every 6 hours, on push to `main`, and on manual dispatch. It
runs the readiness gates, uploads `docs/agent_readiness.md` as an artifact, and
opens or updates a GitHub issue when the app is not output-ready.

## Build Loop

| Lane | Agents | Outcome |
| --- | --- | --- |
| Discover | Product Manager | Clear problem, metric, non-goals |
| Shape | UX Architect | Flow, states, accessibility risks |
| Build | Frontend Developer, Backend Architect, AI Engineer | Durable UI, API behavior, AI contracts |
| Verify | Database Optimizer, Code Reviewer | Data safety, regression review, tests |
| Launch | DevOps Automator | GitHub, Vercel, smoke checks |
| Learn | Technical Writer | Audit notes, demo docs, next candidate |

## How To Use It

1. Open `/admin/agents`.
2. Start with the reusable build prompt.
3. Replace the sample feature line with the next Hire Ground improvement.
4. Execute lanes in order.
5. Do not advance a lane until its exit criteria are met.
6. Update `docs/audit.md` or `docs/demo.md` after behavior changes.

## Commands

```bash
pnpm agents:build
```

This command runs test, typecheck, lint, and production build gates, then writes
a readiness report. In CI, a failing report becomes a GitHub issue for the next
agent pass.

## Rule Of Thumb

The agent architecture should prevent vague building. Every meaningful feature
should leave behind:

- a product reason
- a UX flow
- an implementation slice
- a verification record
- a deployment record
- a learning note

## Source

Reference architecture: `https://github.com/msitarzewski/agency-agents`
