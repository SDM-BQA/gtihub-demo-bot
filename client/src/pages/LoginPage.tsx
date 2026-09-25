export function LoginPage() {
  return (
    <main className="center">
      <h1>GitHub Automation Bot</h1>
      <p className="muted">Label, comment and notify Slack automatically when things happen in your repos.</p>
      {/* A full-page navigation, not fetch: the OAuth flow needs real browser redirects. */}
      <a className="button" href="/auth/github/login">
        Sign in with GitHub
      </a>
    </main>
  );
}
