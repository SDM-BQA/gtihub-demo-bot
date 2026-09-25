# AI log

Running notes kept during the build. This is the raw material for AI_NOTES.md. Entries are short and factual; rewrite them in
your own words for AI_NOTES.md.

Tools: Claude Code (VS Code extension), model Claude Opus 5.5.

## Decisions I made (and why)

| Chunk | Decision | Alternatives the AI offered | Why I chose it |
| --- | --- | --- | --- |
| 0 | Postgres on Neon | AI recommended MongoDB Atlas (familiar to me from MERN) | Suggested in the brief; Postgres row locking (`FOR UPDATE SKIP LOCKED`) makes the job queue safe |
| 0 | GitHub App instead of an OAuth App | OAuth App plus a per-repo webhook | One webhook URL for all repos, short-lived installation tokens, multi-repo support for free |
| 0 | TypeScript | AI suggested plain JS to save time | _fill in_ |

## Where the AI went wrong (or nearly did)

Format: **what happened → how it was noticed → fix**.

### Chunk 0: incomplete reading of the brief

- The first plan skipped several deliverables: reviewers testing with _their own_ GitHub account (the app must be installable by any account), how they would see Slack messages, CLAUDE.md having to be used from day 1 rather than written at the end, and the `push` event.
- **Noticed:** I asked the AI to re-check the PDF for anything it had overlooked.
- **Fix:** made a line-by-line `docs/CHECKLIST.md` from the brief, used as the source of truth.

### Chunk 1: request logs leaked headers

- The AI's first `pino-http` setup used the default serializers, which log **every request header** on every request, including `cookie` and (later) `x-hub-signature-256`. The redaction list covered only some keys, so a new sensitive header would have leaked.
- **Noticed:** while running the production build locally, the log lines were huge and included full header objects.
- **Fix:** custom serializers log only `method`, `url` and `statusCode` (an allow-list instead of a block-list).

### Chunk 1: near miss on the Render build

- Setting `NODE_ENV=production` on Render also applies at _build_ time, so `npm ci` would skip devDependencies (`typescript`, `vite`) and the build would fail.
- **Caught** during review before the first deploy; the build command uses `npm ci --include=dev`. **Confirmed:** first Render deploy built successfully with this flag.

### Chunk 2: npm "latest" pointed at a release candidate

- `npm view prisma version` returned `8.0.0-rc.17`; the dist-tags show `latest` currently points to an RC, while `prev` is `7.10.0`.
- **Noticed:** checked versions before installing (Prisma's setup changes a lot between major versions).
- **Fix:** pinned `prisma`, `@prisma/client` and `@prisma/adapter-pg` to `7.10.0`. Prisma also shows an "update available" banner pointing at the RC; ignore it.

### Chunk 2: worker design vs. Neon free-tier limits (design catch)

- The first plan (Chunk 0) had the worker poll the DB every few seconds. On Neon's free tier that keeps the database awake 24/7
  and uses up the monthly compute allowance, so the DB would stop partway through the month, likely while reviewers are testing.
- **Noticed:** while planning the `/health` route and the worker, by checking what calls the DB and how often.
- **Fix:** event-driven wake-ups (new event, retry timer, startup) instead of polling; `/health` never touches the DB.

### Chunk 3: security and free-tier details in the login flow

- **Installation hijack:** GitHub's post-install redirect carries an `installation_id` in the URL. Trusting it would let anyone
  link someone else's installation to their account by editing the URL. Instead we list installations with the user's *own*
  OAuth token (`GET /user/installations`) and link only those.
- **No stored GitHub user tokens:** the token is used once during the callback and then discarded; the session only holds `userId`.
- **Session pruning vs. Neon:** `connect-pg-simple` prunes expired sessions every 15 min by default, which would keep Neon awake.
  Turned off; expired sessions are deleted on login instead.
- **CSP blocked avatars:** helmet's default `img-src 'self'` would block GitHub avatar images; allowed `avatars.githubusercontent.com` explicitly.
- `npm audit` reports high-severity `mysql2` issues from the Prisma **CLI** (dev tool only; we use Postgres). The suggested
  "fix" downgrades Prisma to v6, so it was left as is.

### Chunk 3: the "connect repo" flow only handled the first install

- The AI designed the install flow assuming GitHub always redirects back to our callback after installing. In testing, the
  app had been installed **after** I signed in (from the GitHub App's own page), so the DB had my user but 0 installations,
  and "Connect repositories" opened `github.com/settings/installations/<id>`, which never redirects back.
- **Noticed:** clicked "Connect repositories" and landed on GitHub's settings page; querying the DB showed `installations: []`.
- **Fix:** a "Refresh" link re-runs sign-in (GitHub bounces back instantly) so the callback re-syncs; in Chunk 4 the
  `installation` / `installation_repositories` webhooks keep repos in sync automatically.
- Side lesson: a one-off DB script hung forever because the shared `pg` pool keeps Node alive; scripts must call `pool.end()`.

### Chunk 4: webhook endpoint, tested locally with a signing script

- Wrote `server/scripts/send-test-webhook.ts` to sign fake webhooks, so forgery and replay could be tested without GitHub.
  Results: valid → 202 recorded; same delivery ID → 202 duplicate (nothing inserted); wrong secret → 401; no signature → 401.
- Decision: a duplicate delivery returns **202**, not 409. An error would make GitHub mark the delivery failed and retry it.
- Decision: dedupe with `createMany({ skipDuplicates: true })` on the unique `deliveryId` (count 0 = duplicate) instead of
  try/catch on a unique-constraint error. It is one statement and has no race between "check" and "insert".
- Near miss: the fake test event pointed at real issue #1 of the test repo; deleted it before building the worker so the
  bot wouldn't label or comment on a real issue.
