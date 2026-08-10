'use client';

import { useEffect } from 'react';

// Catches app-level render/hydration crashes, reports them to Telegram, and
// shows a minimal fallback. global-error replaces the root layout, so it must
// render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Stale-tab-vs-fresh-deploy crashes self-heal via the reload guard in the
    // root layout — reporting them just spams the owner with noise.
    const selfHealing =
      /Loading chunk [^ ]+ failed|ChunkLoadError|Failed to fetch dynamically imported module|parallelRoutes|\.children'\)/i.test(
        String(error?.message ?? ''),
      );
    if (selfHealing) return;
    try {
      fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message || String(error),
          digest: error?.digest,
          path: typeof window !== 'undefined' ? window.location.pathname : '',
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* never let reporting throw */
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0b0d',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div>
          <p style={{ fontSize: '18px', marginBottom: '16px' }}>Something went wrong.</p>
          <button
            onClick={() => reset()}
            style={{
              border: '1px solid #1c69d4',
              background: '#1c69d4',
              color: '#fff',
              padding: '10px 20px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
