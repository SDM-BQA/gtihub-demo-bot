import { githubApp } from '../github/app.js';

// All write-backs to GitHub run as the app installation (short-lived installation token, created and cached by octokit).
export interface IssueRef {
  installationId: number;
  repoFullName: string; // "owner/name"
  number: number;
}

async function clientFor({ installationId, repoFullName, number }: IssueRef) {
  const octokit = await githubApp.getInstallationOctokit(installationId);
  const [owner, repo] = repoFullName.split('/');
  return { octokit, params: { owner, repo, issue_number: number } };
}

// Adding a label that is already there is a no-op on GitHub, so this is safe to repeat.
// PRs are issues too in GitHub's API, so this works for both.
export async function addLabel(ref: IssueRef, label: string): Promise<void> {
  const { octokit, params } = await clientFor(ref);
  await octokit.rest.issues.addLabels({ ...params, labels: [label] });
}

// Posts a comment unless one with the same hidden marker already exists. This covers the case where the comment was
// posted but we crashed before recording it: the retry finds the marker and doesn't post a duplicate.
export async function commentOnce(ref: IssueRef, body: string, marker: string): Promise<'posted' | 'already posted'> {
  const { octokit, params } = await clientFor(ref);
  const tag = `<!-- ${marker} -->`;

  const existing = await octokit.paginate(octokit.rest.issues.listComments, { ...params, per_page: 100 });
  if (existing.some((c) => c.body?.includes(tag))) return 'already posted';

  await octokit.rest.issues.createComment({ ...params, body: `${body}\n\n${tag}` });
  return 'posted';
}
