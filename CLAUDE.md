# CLAUDE.md

Context for AI assistants working in this repo.

## Project

Event-Driven GitHub Automation Bot (a job-interview take-home, 2-day deadline).
A user signs in with GitHub and installs our GitHub App on their repos. GitHub webhooks (issues, pull_request, push) are
matched against rules the user configures. The bot then labels or comments on GitHub, sends a Slack message, and
optionally adds an AI summary. A dashboard behind login shows the event and action log and lets the user edit rules.

Requirements tracker: `docs/CHECKLIST.md`. Check new work against it.

## Stack

- TypeScript everywhere. Node 22, Express, Prisma → Neon Postgres
- Prisma is **pinned to 7.10.0** (npm's `latest` tag points to an 8.0 RC). Prisma 7 specifics: config lives in
  `server/prisma.config.ts` (loads `../.env` itself), the client is generated into `server/src/generated/prisma` (gitignored)
  and uses the `@prisma/adapter-pg` driver adapter. Import it from `db/prisma.ts` only.
- Neon has two URLs: `DATABASE_URL` (pooled, the app) and `DIRECT_URL` (direct, migrations only). Migrations run during the Render build.
- Schema changes: edit `schema.prisma` → `npm run db:migrate -w server -- --name <change>` → commit the migration folder.
- React + Vite (in `client/`), built and served by Express, so there is one origin and one Render service
- GitHub App via `octokit`, sessions via `express-session` + Postgres store, env validation via `zod`, logs via `pino`
- Slack Incoming Webhook; AI via Groq free tier
- Hosting: Render free tier. Everything must be free with no credit card.

## Architecture rules

- **Save first, process later.** The webhook route verifies the signature, inserts the Event, and replies 202. It does no other work.
- The worker (`worker/`) claims events with `FOR UPDATE SKIP LOCKED` and a 10-min lease (`queue.ts`), runs the matching rules'
  actions (`processEvent.ts`), and retries failures with backoff 1m/5m/15m/1h (max 5 attempts, then FAILED).
  Actions live in `worker/actions/` (one file each, registered in `index.ts`). Comments use a hidden marker to stay idempotent.
- Local dev and Render share one Neon DB, so a running local server also processes live events. Stop it for clean live tests.
- **No constant DB polling.** Neon's free tier suspends when idle and caps compute hours, so a 5-second poll would drain the
  quota. The worker wakes only when (a) the webhook route saves a new event, (b) a retry timer for the next `nextAttemptAt` fires, or
  (c) the server starts. `/health` never touches the DB (Render and the keep-alive pinger call it constantly).
- Idempotency: `Event.deliveryId` is unique; `ActionLog` is unique on (eventId, actionType, value), so an action that already succeeded is skipped on retry.
- Webhook flow: `routes/webhook.routes.ts` (express.raw) → `middleware/verifyGithubSignature.ts` → `webhooks/handlers.ts`
  (a lookup table keyed by `X-GitHub-Event`). Duplicates return **202**, not an error, so GitHub doesn't retry them.
- Payloads are normalized once (`github/normalize.ts`) so rules and actions never touch raw GitHub payloads.
- Test webhooks locally with `npm run webhook:test -w server -- --repo-id <githubRepoId> [--delivery <id>] [--bad-signature]`.
- One-off DB scripts must call `pool.end()` (from `db/pool.ts`), or Node never exits.
- The bot only reacts to `opened` actions and ignores `sender.type === "Bot"`, so it never triggers itself.

## Code style

- Small files, each with one job. Controllers are thin; logic lives in services.
- Express 5 passes async errors to `errorHandler` on its own, so there is no try/catch in controllers and no `asyncHandler`. Throw `HttpError` for 4xx.
- One frontend API client instead of fetch calls copied around the code.
- The server is ESM with `NodeNext`: relative imports **must** end in `.js` (e.g. `./app.js`), even in `.ts` files.
- Env vars are read only through `config/env.ts` (zod-validated), never through `process.env` elsewhere. Add each new var to `.env.example` too.
- Simple over clever: no extra abstractions or libraries unless they remove real code.
- Match the surrounding code; keep comments short and only explain the *why*.

## Security (never break these)

- Never commit secrets. `.env` is gitignored; `.env.example` holds placeholders only.
- Never log tokens, secrets, or full webhook payloads; the pino logger redacts known keys.
- No secret or GitHub token ever reaches the client bundle or an API response.
- Webhook signature checks run on the **raw** body with `crypto.timingSafeEqual`.
- GitHub **user** tokens are never stored: used once in the OAuth callback, then discarded. Sessions hold only `userId`/`oauthState`.
- Never trust an `installation_id` from a URL; link installations only via the user's own `GET /user/installations`.
- Sessions are mounted only on `/auth` and `/api` (not `/health` or webhooks). Cookie: httpOnly, secure in prod, sameSite=lax.
  The session ID is regenerated on login.
- Octokit clients come from `github/app.ts` (`githubApp`). For bot actions use `githubApp.getInstallationOctokit(id)`.
- Every user-data query is scoped to the owner (`installation: { userId }`); anything not owned is a **404** (see
  `services/rules.service.ts`). Request bodies go through `validateBody(zodSchema)`; route IDs go through `parseId`.

## Working style with the developer

- The developer (~9 months MERN, first bot) wants to understand every step. Before each chunk, explain the concept in a few lines, then write the code.
- Work in the chunks listed in `docs/CHECKLIST.md`; suggest a commit at the end of each chunk.
- At the end of **every** chunk, update `docs/ai-log.md` without being asked:
  - decisions the developer made (and alternatives rejected)
  - any AI mistake or near miss (what went wrong, how it was noticed, the fix), including ones the AI caught itself
  This feeds `AI_NOTES.md` (the ~1-page deliverable, written by the developer in their own words; don't fill its TODOs with invented reasons).
- Update this file when a new convention is set (new library, new pattern), so it always matches how the code is really written.
