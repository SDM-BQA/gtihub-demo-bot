import { useEffect, useState } from 'react';

// Placeholder page for Chunk 1: proves the React app can reach the API.
export function App() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    fetch('/health')
      .then((res) => res.json())
      .then((data: { status: string }) => setStatus(data.status))
      .catch(() => setStatus('unreachable'));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>GitHub Automation Bot</h1>
      <p>API status: {status}</p>
    </main>
  );
}
