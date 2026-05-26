'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setStep('code');
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const cleaned = code.replace(/\s/g, '');
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: cleaned,
      type: 'email',
    });
    setBusy(false);
    if (error || !data.session) {
      setError(error?.message ?? 'That code did not work. Try again.');
      return;
    }
    // Decide where to send them: onboarding if they haven't completed it, else `next`.
    const userId = data.session.user.id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', userId)
      .single();
    const needsOnboarding = !profile?.onboarded_at;
    if (needsOnboarding) {
      router.replace(`/onboarding?next=${encodeURIComponent(next)}`);
    } else {
      router.replace(next);
    }
  }

  return (
    <main className="space-y-8 pt-12">
      <header className="text-center space-y-2">
        <Flag aria-hidden className="w-10 h-10 mx-auto text-accent" strokeWidth={1.75} />
        <div className="eyebrow text-ink-muted/80">Fairway</div>
        <h1 className="text-3xl font-medium tracking-tight">Sign in</h1>
        <p className="text-sm text-ink-muted">
          {step === 'email' ? "We'll email you a sign-in code." : `Enter the code we sent to ${email}.`}
        </p>
      </header>

      {step === 'email' ? (
        <form onSubmit={sendCode} className="card space-y-3">
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
            {busy ? 'Sending…' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="card space-y-3">
          <label className="label" htmlFor="code">Verification code</label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={10}
            required
            autoFocus
            className="input text-center text-2xl tracking-[0.3em] font-medium"
            placeholder="······"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={busy || code.length < 6} className="btn-primary w-full">
            {busy ? 'Verifying…' : 'Sign in'}
          </button>
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError(null); }}
              className="text-xs text-ink-faint hover:text-ink"
            >
              Use a different email
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void sendCode()}
              className="text-xs text-ink-muted hover:text-ink"
            >
              Resend code
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
