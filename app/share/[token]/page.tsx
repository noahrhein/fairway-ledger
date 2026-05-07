'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getRoundByShareToken,
  claimRoundSlot,
  getCurrentUser,
  type SharePreview,
} from '../../../lib/db';
import { Flag, Check } from 'lucide-react';

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [preview, setPreview] = useState<SharePreview | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(`/share/${token}`)}`);
        return;
      }
      setUserId(user.id);
      const p = await getRoundByShareToken(token);
      setPreview(p);
      setReady(true);
    })();
  }, [token, router]);

  if (!ready) return null;
  if (!preview) {
    return (
      <main className="space-y-4 pt-12 text-center">
        <p className="text-ink-muted">This share link is invalid or the round was removed.</p>
        <Link href="/" className="btn-ghost">Back to home</Link>
      </main>
    );
  }

  const alreadyIn = preview.players.find((p) => p.userId === userId);
  if (alreadyIn) {
    router.replace(`/round/${preview.id}`);
    return null;
  }

  async function handleClaim(slot: number) {
    setBusy(true);
    setError(null);
    const result = await claimRoundSlot(token, slot);
    setBusy(false);
    if (!result) {
      setError('Could not claim that slot — it may already be taken.');
      const p = await getRoundByShareToken(token);
      setPreview(p);
      return;
    }
    router.replace(`/round/${preview!.id}`);
  }

  const fmt = preview.format;
  const stake =
    fmt.type === 'nassau' ? `Nassau · F9 $${fmt.stakes.f9} / B9 $${fmt.stakes.b9} / Total $${fmt.stakes.total}`
    : fmt.type === 'skins' ? `Skins · $${fmt.stakePerSkin} per skin`
    : `Wolf · $${fmt.stakePerPoint} per point`;

  return (
    <main className="space-y-6">
      <header className="text-center pt-4 space-y-1">
        <Flag aria-hidden className="w-8 h-8 mx-auto text-accent" strokeWidth={1.75} />
        <div className="eyebrow text-ink-muted/80">You're invited</div>
        <h1 className="text-3xl font-medium tracking-tight">{preview.course}</h1>
        <p className="text-sm text-ink-muted">
          {new Date(preview.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <p className="text-xs text-ink-muted">{stake}</p>
      </header>

      <section className="space-y-2">
        <h2 className="eyebrow">Pick your spot</h2>
        <ul className="card divide-y divide-line py-0">
          {preview.players.map((p) => {
            const claimed = !!p.userId;
            return (
              <li key={p.id} className="row">
                <div className="row-icon text-sm font-medium">{p.name.charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    {claimed ? 'Already linked' : 'Available'}
                  </div>
                </div>
                {claimed ? (
                  <span className="text-xs text-ink-faint inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Taken
                  </span>
                ) : (
                  <button
                    onClick={() => handleClaim(p.slot)}
                    disabled={busy}
                    className="text-xs px-3 py-1.5 rounded-full bg-ink text-bg font-medium"
                  >
                    That's me
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </section>

      <p className="text-xs text-ink-faint text-center">
        Don't see your name? Ask the host to add you, then refresh this page.
      </p>
    </main>
  );
}
