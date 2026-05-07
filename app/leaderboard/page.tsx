'use client';

import { useEffect, useMemo, useState } from 'react';
import { getRounds, getCurrentUser } from '../../lib/db';
import { computeLeaderboard } from '../../lib/leaderboard';
import type { Round } from '../../types';
import { Trophy } from 'lucide-react';

type SortKey = 'net' | 'rounds';

export default function LeaderboardPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [sort, setSort] = useState<SortKey>('net');

  useEffect(() => {
    (async () => {
      const [user, list] = await Promise.all([getCurrentUser(), getRounds()]);
      setUserId(user?.id ?? null);
      setRounds(list);
      setReady(true);
    })();
  }, []);

  const lb = useMemo(() => {
    const entries = computeLeaderboard(rounds, userId);
    if (sort === 'rounds') return [...entries].sort((a, b) => b.rounds - a.rounds);
    return entries;
  }, [rounds, sort, userId]);

  const you = lb.find((e) => e.isYou);

  return (
    <main className="space-y-6">
      <header className="pt-1">
        <div className="eyebrow text-ink-muted/80">Fairway</div>
        <h1 className="text-2xl font-medium tracking-tight">Leaderboard</h1>
      </header>

      <section className="card-hero">
        <div className="eyebrow text-ink-muted/70">Your record</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-5xl font-medium tracking-tight ${you && you.net < 0 ? 'text-amber' : ''}`}>
            {you ? (you.net >= 0 ? '+' : '−') : ''}${you ? Math.abs(you.net).toFixed(2) : '0.00'}
          </span>
        </div>
        <div className="mt-2 text-sm text-ink-muted">
          {you ? `${you.rounds} round${you.rounds === 1 ? '' : 's'} played` : 'No rounds played yet.'}
        </div>
        <Trophy aria-hidden className="absolute right-6 top-6 w-6 h-6 text-ink-muted" strokeWidth={1.75} />

        {you && (
          <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-ink text-bg px-4 py-2 shadow-pill">
            <span className="text-xs text-bg/60">Won</span>
            <span className="text-sm font-medium">${you.received.toFixed(2)}</span>
            <span className="text-xs text-bg/60">·</span>
            <span className="text-xs text-bg/60">Paid</span>
            <span className="text-sm font-medium">${you.paid.toFixed(2)}</span>
          </div>
        )}
      </section>

      <div className="seg-group">
        {(['net', 'rounds'] as SortKey[]).map((sk) => (
          <button key={sk} onClick={() => setSort(sk)} className={`seg ${sort === sk ? 'seg-active' : ''}`}>
            {sk === 'net' ? 'By net' : 'By rounds'}
          </button>
        ))}
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">Standings</h2>
          <span className="text-xs text-ink-faint">{lb.length}</span>
        </div>
        {!ready ? null : lb.length === 0 ? (
          <div className="card text-ink-muted text-center py-8 text-sm">
            Play a round to populate the leaderboard.
          </div>
        ) : (
          <ul className="card divide-y divide-line py-0">
            {lb.map((entry, i) => {
              const positive = entry.net > 0;
              const negative = entry.net < 0;
              return (
                <li key={entry.key} className="row">
                  <div className="row-icon text-sm font-medium">{i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className={`font-medium truncate ${entry.isYou ? 'text-accent' : ''}`}>{entry.name}</div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      {entry.rounds} round{entry.rounds === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${positive ? 'text-accent' : negative ? 'text-amber' : 'text-ink-muted'}`}>
                      {positive ? '+' : negative ? '−' : ''}${Math.abs(entry.net).toFixed(2)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-faint mt-0.5">
                      {entry.received > 0 || entry.paid > 0
                        ? `+${entry.received.toFixed(0)} / −${entry.paid.toFixed(0)}`
                        : '—'}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
