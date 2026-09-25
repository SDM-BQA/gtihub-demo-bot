# Requirements checklist

Every item from the assignment brief, with how we meet it. Tick an item only after it has been tested on the **live URL**.

## Core requirements
- [x] **C1** Deployed, publicly reachable web app: Render web service (API + React build on one origin)
- [ ] **C2** GitHub sign-in and connecting a repo the user owns: GitHub App user login + installing the app on selected repos
- [x] **C3** Webhook endpoint receives ≥2 event types and records them: `issues`, `pull_request`, `push` → `Event` table
- [x] **C4** Write back to GitHub for ≥1 event type: add a label and/or post a comment via an installation token
- [x] **C5** Slack notification when a configured event occurs: Slack Incoming Webhook, triggered by a rule action
- [ ] **C6** Dashboard (behind login) with received events and the actions taken
- [ ] **C7** README.md: run locally and how it was deployed

## Stretch goals
- [ ] **S1** Rules configurable in the UI: match on keywords, author and labels
- [ ] **S2** AI step: summary, suggested label and priority, shown in Slack **and** on the dashboard (Groq, free tier)
- [x] **S3** Authenticate as a GitHub App: JWT → installation tokens (octokit)
- [ ] **S4** Multiple repos per user: one installation can cover many repos; rules are scoped per repo
- [ ] **S5** Observability: structured logs (pino) and a visible history of failures and retries in the dashboard

## Quality bar
- [ ] **Q1** Forged or replayed requests
  - Webhook: HMAC-SHA256 on the raw body with a timing-safe compare; `X-GitHub-Delivery` stored under a unique constraint
  - OAuth callback: `state` parameter checked against the session
  - Install setup callback: `installation_id` verified against the logged-in user's own installations (it cannot be claimed by someone else)
  - Dashboard API: session cookie (httpOnly, secure, sameSite=lax), JSON-only requests
- [x] **Q2** No duplicate side effects: dedupe by delivery ID, plus one row per (event, action), so a retry skips actions that already succeeded
- [ ] **Q3** No silently lost events
  - The event is saved before we reply; if the DB is down we return 5xx so GitHub marks the delivery failed
  - Actions retry with backoff; the final failure stays visible in the dashboard
  - On startup and on a schedule, list failed GitHub App deliveries and request redelivery (covers Render cold starts and downtime)
  - The worker claims jobs atomically (`FOR UPDATE SKIP LOCKED`)
- [ ] **Q4** No exposed secrets: `.env` is gitignored, `.env.example` has placeholders, logger redaction, no secrets in the client bundle, tokens encrypted/never sent to the browser
- [ ] Bot does not trigger itself (acts only on `opened`, ignores `sender.type === "Bot"`)

## Constraints
- [ ] Every service is free with no card: Render, Neon, GitHub, Slack, Groq, cron-job.org

## Deliverables
- [ ] **D1** GitHub repo with a clear commit history (one commit per chunk)
- [ ] **D2** Live URL that works on first open (keep-alive pinger for Render's free-tier sleep)
- [ ] **D3** README: what it does, local setup, env vars, `.env.example`, how and where it is deployed
- [ ] **D4** Way for reviewers to test: a public demo repo, a Slack channel invite link, step-by-step instructions
- [ ] **D5** AI context files exactly as used: `CLAUDE.md` (kept up to date from day 1)
- [ ] **D6** AI_NOTES.md (~1 page): tools and models, how work was split, 2–3 decisions made by me and why, the hardest AI-caused bug, improvements

## Final check (before submitting)
- [ ] Full flow tested from a **different GitHub account** on the live URL
- [ ] Forged request → 401; redelivered request → no second comment; Slack URL broken → retries shown, then recovered
- [ ] `git log` has no secrets (scan the history, not just the current files)
