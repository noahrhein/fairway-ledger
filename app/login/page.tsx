'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { Flag } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const supabase = createClient();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="space-y-8 pt-12">
      <header className="text-center space-y-2">
        <Flag aria-hidden className="w-10 h-10 mx-auto text-accent" strokeWidth={1.75} />
        <div className="eyebrow text-ink-muted/80">Fairway</div>
        <h1 className="text-3xl font-medium tracking-tight">Sign in</h1>
        <p className="text-sm text-ink-muted">We'll email you a magic link.</p>
      </header>

      {sent ? (
        <section className="card text-center space-y-2">
          <div className="text-lg font-medium">Check your email</div>
          <p className="text-sm text-ink-muted">
            Sent a sign-in link to <span className="text-ink">{email}</span>.
          </p>
          <button
            onClick={() => { setSent(false); setEmail(''); }}
            className="btn-ghost text-xs mt-2"
          >
            Use a different email
          </button>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={busy || !email} className="btn-primary w-full">
            {busy ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      )}
    </main>
  );
}
