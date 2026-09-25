import type { Octokit } from 'octokit';
import { prisma } from '../db/prisma.js';
import { githubApp } from '../github/app.js';

type GithubRepo = { id: number; full_name: string };

// Links a user to the installations *their own* GitHub token can see. We never trust an installation_id from a URL,
// so nobody can claim someone else's installation by editing the redirect.
export async function syncUserInstallations(userOctokit: Octokit, userId: number) {
  const installations = await userOctokit.paginate(userOctokit.rest.apps.listInstallationsForAuthenticatedUser);

  for (const inst of installations) {
    const accountLogin = inst.account && 'login' in inst.account ? inst.account.login : 'unknown';
    const installation = await prisma.installation.upsert({
      where: { githubInstallationId: BigInt(inst.id) },
      create: { githubInstallationId: BigInt(inst.id), accountLogin, userId },
      update: { accountLogin, userId },
    });

    const repos = await userOctokit.paginate(userOctokit.rest.apps.listInstallationReposForAuthenticatedUser, {
      installation_id: inst.id,
    });
    await syncRepos(installation.id, repos);
  }
}

// Called from installation webhooks (app installed, repos added/removed). The webhook payload is signature-verified,
// so `sender` really is the GitHub user who installed it; the installation is linked to them only on first creation.
export async function syncInstallationFromWebhook(githubInstallationId: number, accountLogin: string, senderGithubId?: number) {
  const installer = senderGithubId
    ? await prisma.user.findUnique({ where: { githubId: BigInt(senderGithubId) }, select: { id: true } })
    : null;

  const installation = await prisma.installation.upsert({
    where: { githubInstallationId: BigInt(githubInstallationId) },
    create: { githubInstallationId: BigInt(githubInstallationId), accountLogin, userId: installer?.id },
    update: { accountLogin },
  });

  // Ask GitHub (as the app) for the full current repo list instead of applying added/removed diffs: one code path.
  const appOctokit = await githubApp.getInstallationOctokit(githubInstallationId);
  const repos = await appOctokit.paginate(appOctokit.rest.apps.listReposAccessibleToInstallation);
  await syncRepos(installation.id, repos);
}

// App uninstalled or suspended: keep the history, but stop acting on its repos.
export async function deactivateInstallation(githubInstallationId: number) {
  await prisma.repo.updateMany({
    where: { installation: { githubInstallationId: BigInt(githubInstallationId) } },
    data: { active: false },
  });
}

// Upserts the installation's current repos and marks repos that were removed from it as inactive.
export async function syncRepos(installationId: number, repos: GithubRepo[]) {
  for (const repo of repos) {
    await prisma.repo.upsert({
      where: { githubRepoId: BigInt(repo.id) },
      create: { githubRepoId: BigInt(repo.id), fullName: repo.full_name, installationId },
      update: { fullName: repo.full_name, installationId, active: true },
    });
  }

  await prisma.repo.updateMany({
    where: { installationId, githubRepoId: { notIn: repos.map((r) => BigInt(r.id)) } },
    data: { active: false },
  });
}
