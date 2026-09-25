// Sends a fake "issues.opened" webhook signed like GitHub does. Useful for testing the unhappy paths locally.
//
//   npm run webhook:test -w server -- --repo-id 123 --title "Login bug"      → recorded
//   (same command again with --delivery <id from the first run>)            → duplicate (replay blocked)
//   ... --bad-signature                                                       → 401 (forgery blocked)
//
// --repo-id is the GitHub repository ID (Repo.githubRepoId); --url defaults to the local server.
import { createHmac, randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { env } from '../src/config/env.js';

const { values: args } = parseArgs({
  options: {
    'repo-id': { type: 'string' },
    'repo-name': { type: 'string', default: 'owner/repo' },
    title: { type: 'string', default: 'Test issue: something is broken (bug)' },
    delivery: { type: 'string' },
    'bad-signature': { type: 'boolean', default: false },
    url: { type: 'string', default: `http://localhost:${env.PORT}/webhooks/github` },
  },
});

if (!args['repo-id']) {
  console.error('Missing --repo-id <GitHub repository id>');
  process.exit(1);
}

const deliveryId = args.delivery ?? randomUUID();
const body = JSON.stringify({
  action: 'opened',
  issue: {
    number: 1,
    title: args.title,
    body: 'Sent by send-test-webhook.ts',
    html_url: `https://github.com/${args['repo-name']}/issues/1`,
    user: { login: 'test-user' },
    labels: [],
  },
  repository: { id: Number(args['repo-id']), full_name: args['repo-name'] },
  sender: { id: 1, login: 'test-user', type: 'User' },
});

const secret = args['bad-signature'] ? 'wrong-secret' : env.GITHUB_WEBHOOK_SECRET;
const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

const res = await fetch(args.url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-GitHub-Event': 'issues',
    'X-GitHub-Delivery': deliveryId,
    'X-Hub-Signature-256': signature,
  },
  body,
});

console.log(`delivery ${deliveryId} → ${res.status} ${await res.text()}`);
