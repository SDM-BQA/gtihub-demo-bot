# AI Notes

## Tools and how I split the work

- **Tool:** Claude Code (VS Code extension), model **Claude Opus 5.5**.
- **Context files:** [`CLAUDE.md`](CLAUDE.md), used from the first commit and updated whenever a convention was set.
  I also kept [`docs/CHECKLIST.md`](docs/CHECKLIST.md) (every line of the brief, ticked only after testing on the live URL) and
  [`docs/ai-log.md`](docs/ai-log.md) (running notes on decisions and AI mistakes), which this file is based on.
- **Split:** I broke the project into small chunks, made the key decisions (choosing between the designs the AI proposed,
  and overruling it where I disagreed), and reviewed each chunk before moving on. The AI wrote most of the code and
  explained each concept first, so I understood what I was committing. I did all the testing on the live URL (real issues,
  Slack, the GitHub delivery log), and whenever something went wrong I raised the bug and debugged it with the AI.

## Key decisions I made

1. **TypeScript instead of JavaScript.** The AI suggested plain JS to save time. I chose TypeScript for type safety: with
   webhook payloads, Prisma models and API responses flowing through the app, types catch mistakes before they reach production.
2. **Neon (Postgres) instead of MongoDB.** The AI recommended MongoDB because I already know it from MERN. I picked Neon to learn
   a new database built on Postgres. It paid off: Postgres row locking (`FOR UPDATE SKIP LOCKED`) made the job queue safe,
   and unique constraints made duplicate webhooks harmless.
3. **A GitHub App instead of an OAuth App.** One webhook URL for all repos, short-lived installation tokens, and the bot acts
   as its own identity (`gh-automation-bot[bot]`). It also gave multi-repo support without extra work.

## Hardest bug: every webhook was rejected with 401

**What happened.** After fixing the GitHub App's event subscriptions, real deliveries finally arrived, and every single one
was rejected with `401 Invalid signature`. The signature check was doing its job; the question was which secret was wrong.

**How the AI led me into it.** Earlier, the AI had told me to "delete the duplicate `GITHUB_WEBHOOK_SECRET`" in my `.env`.
It meant *one of the two identical lines*; I read it as the variable itself, and while setting up Render the value there
ended up different from the one in the GitHub App. The instruction was ambiguous and neither of us caught it at the time.

**How I noticed and debugged it.** The response GitHub recorded was 29 bytes, the exact length of `{"error":"Invalid signature"}`,
so the request reached our server. Instead of guessing and re-pasting secrets, we asked GitHub's API for that failed delivery
(`GET /app/hook/deliveries/{id}` returns the exact payload and the signature GitHub sent) and recomputed the HMAC locally with my
`.env` secret. It matched, which proved my local value and the GitHub App agreed, so **Render** was the wrong side. No secret was
ever printed or pasted into the chat.

**Fix.** I re-pasted the secret on Render from `.env`. Then we used GitHub's redelivery API to resend the deliveries that had
failed: they came back `202 recorded`, and redelivering one that was already stored came back `202 duplicate`, which proved
replay protection on the live server.

**What I took from it.** Be precise about instructions ("delete line 39", not "delete the duplicate"), and debug with
evidence: GitHub's delivery log answered in minutes what guessing couldn't. That redelivery API later became the
**redelivery sweeper**, which recovers webhooks lost while Render's free tier was asleep (it recovered 5 on its first run).

## What I'd improve with more time

- **One Slack message per event** instead of one per matching rule (two rules on one issue currently send two messages).
- **Per-user or per-rule Slack channels** instead of one channel for the whole app.
- **Shared organization installations:** today an installation is linked to the one user who connected it.
- **Automated tests** (signature check, rule matching, retry/idempotency) instead of the scripted checks I ran by hand.
- **The worker as a separate process** once there's more than one server instance (the queue is already safe for it).

## Prompt excerpt

After the AI's first plan, I sent it back to the brief. This single prompt led to the requirements checklist that
tracked everything in this project:

> "did u check deliverable properly i need that also, check the document once again and look any overlook areas"

The re-read found gaps the first plan had missed: reviewers testing with their own GitHub accounts (so the app had to be
installable by anyone), how they would see Slack messages, CLAUDE.md having to be used from day one, and the `push` event.
