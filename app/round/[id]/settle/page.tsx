'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getRound, saveRound } from '../../../../lib/storage';
import { venmoChargeUrl } from '../../../../lib/venmo';
import type { Round } from '../../../../types';
import { Flag, Check } from 'lucide-react';

export default function SettlePage() {
  const { id } = useParams<{ id: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRound(getRound(id));
    setReady(true);
  }, [id]);

  if (!ready) return null;
  if (!round) return <p className="text-ink-muted">Round not found.</p>;

  const playerName = (pid: string) => round.players.find((p) => p.id === pid)?.name ?? '?';
  const playerVenmo = (pid: string) =>
    round.players.find((p) => p.id === pid)?.venmoHandle?.replace(/^@/, '');
  const initial = (pid: string) => playerName(pid).charAt(0).toUpperCase();

  function togglePayout(payoutId: string) {
    if (!round) return;
    const payouts = (round.payouts ?? []).map((p) =>
      p.id === payoutId ? { ...p, status: (p.status === 'settled' ? 'pending' : 'settled') as 'pending' | 'settled' } : p
    );
    const allSettled = payouts.length > 0 && payouts.every((p) => p.status === 'settled');
    const updated = { ...round, payouts, settled: allSettled };
    saveRound(updated);
    setRound(updated);
  }

  const payouts = round.payouts ?? [];
  const totalSettled = payouts.reduce((s, p) => s + p.amount, 0);
  const remaining = payouts.filter((p) => p.status !== 'settled').reduce((s, p) => s + p.amount, 0);

  return (
    <main className="space-y-6">
      <header>
        <Link href={`/round/${round.id}`} className="btn-ghost -ml-3 mb-1 px-3 py-2">← {round.course}</Link>
      </header>

      <section className="card-hero">
        <div className="eyebrow text-ink-muted/70">Total to settle</div>
        <div className="mt-2 text-5xl font-medium tracking-tight">${totalSettled.toFixed(2)}</div>
        <div className="mt-2 text-sm text-ink-muted">
          {payouts.length === 0 ? 'All square.' : `${payouts.length} payout${payouts.length === 1 ? '' : 's'}`}
        </div>
        <Flag aria-hidden className="absolute right-6 top-6 w-6 h-6 text-ink-muted" strokeWidth={1.75} />

        {payouts.length > 0 && (
          <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-ink text-bg px-4 py-2 shadow-pill">
            <span className="text-xs text-bg/60">Remaining</span>
            <span className="text-sm font-medium">${remaining.toFixed(2)}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent">
              {payouts.length - payouts.filter((p) => p.status !== 'settled').length}/{payouts.length} done
            </span>
          </div>
        )}
      </section>

      {payouts.length === 0 ? (
        <div className="card text-center text-ink-muted py-8 text-sm">
          Nobody owes anyone.
        </div>
      ) : (
        <section className="space-y-2">
          <h2 className="eyebrow">Payouts</h2>
          <ul className="card divide-y divide-line py-0">
            {payouts.map((p) => {
              const handle = playerVenmo(p.toPlayerId);
              const note = `${round.course} · ${round.format.type}`;
              const settled = p.status === 'settled';
              return (
                <li key={p.id} className="py-3 first:pt-3 last:pb-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="row-icon">{initial(p.fromPlayerId)}</div>
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium truncate ${settled ? 'text-ink-muted line-through' : ''}`}>
                        {playerName(p.fromPlayerId)} <span className="text-ink-faint">→</span> {playerName(p.toPlayerId)}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">{round.format.type}</div>
                    </div>
                    <div className={`text-right ${settled ? 'opacity-60' : ''}`}>
                      <div className="font-medium">${p.amount.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!settled && handle && (
                      <a
                        href={venmoChargeUrl(handle, p.amount, note)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary flex-1"
                      >
                        Open Venmo
                      </a>
                    )}
                    <button
                      onClick={() => togglePayout(p.id)}
                      aria-pressed={settled}
                      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition ${
                        settled
                          ? 'bg-accent-soft text-accent hover:bg-accent/20'
                          : 'bg-ink text-bg shadow-pill hover:opacity-90'
                      }`}
                    >
                      {settled ? (
                        <>
                          <Check aria-hidden className="w-4 h-4" strokeWidth={2.5} />
                          Settled
                        </>
                      ) : (
                        'Mark settled'
                      )}
                    </button>
                  </div>
                  {!settled && !handle && (
                    <p className="text-xs text-ink-faint">No Venmo handle on file for {playerName(p.toPlayerId)}.</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Link href="/" className="btn-ghost block text-center text-xs">Back to home</Link>
    </main>
  );
}
