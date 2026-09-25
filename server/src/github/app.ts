import { App } from 'octokit';
import { env } from '../config/env.js';

// Our GitHub App. octokit handles the auth details:
//  - app.oauth: "Sign in with GitHub" (exchanges the OAuth code for a user token)
//  - app.getInstallationOctokit(id): signs a JWT with the private key and swaps it for a short-lived installation token
export const githubApp = new App({
  appId: env.GITHUB_APP_ID,
  privateKey: Buffer.from(env.GITHUB_PRIVATE_KEY_BASE64, 'base64').toString('utf8'),
  oauth: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
  webhooks: { secret: env.GITHUB_WEBHOOK_SECRET },
});

export const oauthCallbackUrl = `${env.APP_URL}/auth/github/callback`;
export const installUrl = `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`;
