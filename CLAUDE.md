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
- React + Vite (in `client/`), built and served by Express, so there is one origin and one Render service
- GitHub App via `octokit`, sessions via `express-session` + Postgres store, env validation via `zod`, logs via `pino`
- Slack Incoming Webhook; AI via Groq free tier
- Hosting: Render free tier. Everything must be free with no credit card.

## Architecture rules

- **Save first, process later.** The webhook route verifies the signature, inserts the Event, and replies 202. It does no other work.
- The worker claims pending events with `FOR UPDATE SKIP LOCKED` and retries failed actions with backoff.
- Idempotency: `Event.deliveryId` is unique; `ActionLog` is unique on (eventId, actionType, value), so an action that already succeeded is skipped on retry.
- Payloads are normalized once (`worker/normalize.ts`) so rules and actions never touch raw GitHub payloads.
- Actions live in a registry (`worker/actions/`); one file per action. No if/else chains on action type.
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

## Working style with the developer

- The developer (~9 months MERN, first bot) wants to understand every step. Before each chunk, explain the concept in a few lines, then write the code.
- Work in the chunks listed in `docs/CHECKLIST.md`; suggest a commit at the end of each chunk.
- When the developer says the AI got something wrong, add a short entry to `docs/ai-log.md` (what went wrong, how it was noticed, the fix). This feeds AI_NOTES.md.
