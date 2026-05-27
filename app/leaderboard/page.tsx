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

      <section className="card-money">
        <div className="relative z-10">
          <div className="eyebrow text-rolex-ink/60">Your record</div>
          <div className="mt-3 serif text-6xl font-medium leading-none">
            <span className={
              you && you.net > 0 ? 'text-rolex-gold'
              : you && you.net < 0 ? 'text-loss'
              : 'text-rolex-ink'
            }>
              {you ? (you.net > 0 ? '+' : you.net < 0 ? '−' : '') : ''}${you ? Math.abs(you.net).toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="mt-3 text-sm text-rolex-ink/70">
            {you ? `${you.rounds} round${you.rounds === 1 ? '' : 's'} on the books` : 'No rounds played yet.'}
          </div>
          <Trophy aria-hidden className="absolute right-1 -top-2 w-7 h-7 text-rolex-gold/40" strokeWidth={1.5} />

          {you && (
            <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-rolex-dim/60 border border-rolex-edge/30 px-4 py-2 backdrop-blur-sm">
              <span className="text-[10px] uppercase tracking-wider text-rolex-ink/50">Won</span>
              <span className="text-sm font-medium text-rolex-ink">${you.received.toFixed(2)}</span>
              <span className="text-rolex-ink/30">·</span>
              <span className="text-[10px] uppercase tracking-wider text-rolex-ink/50">Paid</span>
              <span className="text-sm font-medium text-rolex-ink">${you.paid.toFixed(2)}</span>
            </div>
          )}
        </div>
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
          <div className="card text-center py-10 space-y-2">
            <Trophy aria-hidden className="w-8 h-8 mx-auto text-ink-faint" strokeWidth={1.5} />
            <div className="font-medium text-ink">Standings open after the first round</div>
            <div className="text-xs text-ink-faint">Play a round and the board fills itself in.</div>
          </div>
        ) : (
          <ul className="card divide-y divide-line py-0">
            {lb.map((entry, i) => {
              const positive = entry.net > 0;
              const negative = entry.net < 0;
              return (
                <li key={entry.key} className="row">
                  <div className={`row-icon text-sm font-medium ${i === 0 ? 'serif text-rolex-gold border-rolex-gold/40' : ''}`}>
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`font-medium truncate ${entry.isYou ? 'text-accent' : ''}`}>{entry.name}</div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      {entry.rounds} round{entry.rounds === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`serif text-xl font-medium leading-none ${positive ? 'text-accent' : negative ? 'text-loss' : 'text-ink-muted'}`}>
                      {positive ? '+' : negative ? '−' : ''}${Math.abs(entry.net).toFixed(0)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-faint mt-1">
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
