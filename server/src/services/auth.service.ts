import { Octokit } from 'octokit';
import { prisma } from '../db/prisma.js';
import { githubApp } from '../github/app.js';
import { syncUserInstallations } from './installation.service.js';

// Exchanges the OAuth code for a user token, uses it once to load the profile and installations, then drops it.
// We never store GitHub user tokens, so there is nothing to leak.
export async function signInWithCode(code: string) {
  const { authentication } = await githubApp.oauth.createToken({ code });
  const userOctokit = new Octokit({ auth: authentication.token });

  const { data: profile } = await userOctokit.rest.users.getAuthenticated();
  const user = await prisma.user.upsert({
    where: { githubId: BigInt(profile.id) },
    create: { githubId: BigInt(profile.id), login: profile.login, avatarUrl: profile.avatar_url },
    update: { login: profile.login, avatarUrl: profile.avatar_url },
  });

  await syncUserInstallations(userOctokit, user.id);
  await prisma.session.deleteMany({ where: { expire: { lt: new Date() } } });

  return user;
}
