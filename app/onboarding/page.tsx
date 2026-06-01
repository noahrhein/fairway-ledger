'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { saveProfile } from '../../lib/db';
import { US_STATES, GAME_OPTIONS } from '../../lib/constants';
import { Flag, Check } from 'lucide-react';
import type { GameKey } from '../../types';

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
  const next = params.get('next') ?? '/app';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [venmo, setVenmo] = useState('');
  const [state, setState] = useState('');
  const [handicap, setHandicap] = useState<string>('');
  const [noHandicap, setNoHandicap] = useState(false);
  const [games, setGames] = useState<GameKey[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, venmo_handle, home_state, handicap, preferred_games')
        .eq('id', user.id)
        .single();
      if (profile) {
        setName(profile.display_name ?? '');
        setVenmo(profile.venmo_handle ?? '');
        setState(profile.home_state ?? '');
        if (profile.handicap !== null && profile.handicap !== undefined) {
          setHandicap(String(profile.handicap));
        }
        setGames((profile.preferred_games ?? []) as GameKey[]);
      }
    })();
  }, [router, supabase]);

  function toggleGame(g: GameKey) {
    setGames((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }

  async function persistAndFinish() {
    setBusy(true);
    setError(null);
    const parsed = noHandicap || !handicap.trim() ? null : Number(handicap);
    const ok = await saveProfile({
      displayName: name.trim(),
      venmoHandle: venmo.trim() || null,
      homeState: state || null,
      handicap: parsed !== null && Number.isFinite(parsed) ? parsed : null,
      preferredGames: games,
    });
    setBusy(false);
    if (!ok) { setError('Could not save. Try again.'); return; }
    router.replace(next);
  }

  function handleNext() {
    if (step === 1) {
      if (!name.trim()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      void persistAndFinish();
    }
  }

  return (
    <main className="space-y-6 pt-8">
      <header className="text-center space-y-2">
        <Flag aria-hidden className="w-9 h-9 mx-auto text-accent" strokeWidth={1.75} />
        <div className="eyebrow text-ink-muted/80">Welcome to Fairway</div>
        <h1 className="text-2xl font-medium tracking-tight">Set up your profile</h1>
        <Stepper step={step} />
      </header>

      <section className="card space-y-4">
        {step === 1 && (
          <>
            <div>
              <label className="label" htmlFor="name">Display name <span className="text-red-400">*</span></label>
              <input
                id="name"
                autoFocus
                required
                className="input"
                placeholder="Noah R."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="venmo">Venmo handle <span className="text-ink-faint">(optional)</span></label>
              <input
                id="venmo"
                className="input"
                placeholder="@noah-r"
                value={venmo}
                onChange={(e) => setVenmo(e.target.value)}
              />
              <p className="text-xs text-ink-faint mt-1">So friends can pay you out with one tap.</p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="label" htmlFor="state">Home state <span className="text-ink-faint">(optional)</span></label>
              <select
                id="state"
                className="input"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                <option value="">Select a state…</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="handicap">Handicap index <span className="text-ink-faint">(optional)</span></label>
              <input
                id="handicap"
                type="number"
                step="0.1"
                min={-10}
                max={54}
                disabled={noHandicap}
                className="input disabled:opacity-50"
                placeholder="e.g. 12.4"
                value={handicap}
                onChange={(e) => setHandicap(e.target.value)}
              />
              <label className="flex items-center gap-2 mt-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={noHandicap}
                  onChange={(e) => { setNoHandicap(e.target.checked); if (e.target.checked) setHandicap(''); }}
                />
                I don't have a handicap
              </label>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <div className="label">Games you like <span className="text-ink-faint">(optional)</span></div>
              <p className="text-xs text-ink-faint mb-3">Tap any that sound fun. We'll default new rounds to your favorite.</p>
              <div className="flex flex-wrap gap-2">
                {GAME_OPTIONS.map((g) => {
                  const on = games.includes(g.key);
                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => toggleGame(g.key)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium border transition ${
                        on
                          ? 'bg-ink text-bg border-ink shadow-pill'
                          : 'bg-bg-elevated text-ink-muted border-line hover:text-ink'
                      }`}
                    >
                      {on && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                      {g.label}
                    </button>
                  );
                })}
              </div>
              <ul className="mt-4 space-y-1 text-xs text-ink-faint">
                {GAME_OPTIONS.filter((g) => games.includes(g.key)).map((g) => (
                  <li key={g.key}>· <span className="text-ink-muted">{g.label}</span> — {g.blurb}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 pt-1">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="btn-secondary flex-1"
              disabled={busy}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={busy || (step === 1 && !name.trim())}
            className="btn-primary flex-1"
          >
            {step === 3 ? (busy ? 'Saving…' : 'Finish') : 'Continue'}
          </button>
        </div>

        {step > 1 && (
          <button
            type="button"
            onClick={() => void persistAndFinish()}
            disabled={busy}
            className="block mx-auto text-xs text-ink-faint hover:text-ink"
          >
            Skip for now
          </button>
        )}
      </section>
    </main>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-2 pt-1">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={`h-1.5 rounded-full transition-all ${
            n === step ? 'w-8 bg-accent' : n < step ? 'w-4 bg-ink-muted' : 'w-4 bg-line'
          }`}
        />
      ))}
    </div>
  );
}
