'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { Flag } from 'lucide-react';

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}

function OnboardingInner() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const [name, setName] = useState('');
  const [venmo, setVenmo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, venmo_handle')
        .eq('id', user.id)
        .single();
      if (profile) {
        setName(profile.display_name ?? '');
        setVenmo(profile.venmo_handle ?? '');
      }
    })();
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: name.trim(),
        venmo_handle: venmo.trim() || null,
      });
    setBusy(false);
    if (error) { setError(error.message); return; }
    router.replace(next);
  }

  return (
    <main className="space-y-8 pt-12">
      <header className="text-center space-y-2">
        <Flag aria-hidden className="w-10 h-10 mx-auto text-accent" strokeWidth={1.75} />
        <div className="eyebrow text-ink-muted/80">Welcome to Fairway</div>
        <h1 className="text-3xl font-medium tracking-tight">Your profile</h1>
        <p className="text-sm text-ink-muted">How should friends see you?</p>
      </header>

      <form onSubmit={handleSubmit} className="card space-y-3">
        <label className="label" htmlFor="name">Display name</label>
        <input
          id="name"
          autoFocus
          required
          className="input"
          placeholder="Noah R."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="label" htmlFor="venmo">Venmo handle <span className="text-ink-faint">(optional)</span></label>
        <input
          id="venmo"
          className="input"
          placeholder="@noah-r"
          value={venmo}
          onChange={(e) => setVenmo(e.target.value)}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" disabled={busy || !name.trim()} className="btn-primary w-full">
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </main>
  );
}
