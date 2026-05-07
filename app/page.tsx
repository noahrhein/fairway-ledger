'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getRounds, getCurrentUser } from '../lib/db';
import { computeLeaderboard } from '../lib/leaderboard';
import type { Round } from '../types';
import { Flag } from 'lucide-react';

type Filter = 'all' | 'open' | 'settled';

export default function HomePage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    (async () => {
      const [user, list] = await Promise.all([getCurrentUser(), getRounds()]);
      setUserId(user?.id ?? null);
      setRounds(list);
      setReady(true);
    })();
  }, []);

  const career = useMemo(() => {
    const lb = computeLeaderboard(rounds, userId);
    return lb.find((e) => e.isYou) ?? null;
  }, [rounds, userId]);

  const filtered = useMemo(() => {
    if (filter === 'open') return rounds.filter((r) => !r.settled);
    if (filter === 'settled') return rounds.filter((r) => r.settled);
    return rounds;
  }, [rounds, filter]);

  return (
    <main className="space-y-6">
      <header className="pt-1 flex items-center justify-between">
        <div>
          <div className="eyebrow text-ink-muted/80">Fairway</div>
          <h1 className="text-2xl font-medium tracking-tight">Ledger</h1>
        </div>
        <Link
          href="/round/new"
          className="w-10 h-10 rounded-full bg-ink text-bg flex items-center justify-center text-xl shadow-pill"
          aria-label="New round"
        >
          +
        </Link>
      </header>

      <div className="seg-group">
        {(['all', 'open', 'settled'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`seg capitalize ${filter === f ? 'seg-active' : ''}`}
          >
            {f}
          </button>
        ))}
      </div>

      <section className="card-hero">
        <div className="eyebrow text-ink-muted/70">Career earnings</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-5xl font-medium tracking-tight ${career && career.net < 0 ? 'text-amber' : career && career.net > 0 ? 'text-accent' : ''}`}>
            {career ? (career.net >= 0 ? '+' : '−') : ''}${ready ? Math.abs(career?.net ?? 0).toFixed(2) : '—'}
          </span>
        </div>
        <div className="mt-2 text-sm text-ink-muted">
          {!career ? 'No rounds played yet.' : `${career.rounds} round${career.rounds === 1 ? '' : 's'} played`}
        </div>
        <Flag aria-hidden className="absolute right-6 top-6 w-6 h-6 text-ink-muted" strokeWidth={1.75} />

        {career && (
          <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-ink text-bg px-4 py-2 shadow-pill">
            <span className="text-xs text-bg/60">Won</span>
            <span className="text-sm font-medium">${career.received.toFixed(2)}</span>
            <span className="text-xs text-bg/60">·</span>
            <span className="text-xs text-bg/60">Paid</span>
            <span className="text-sm font-medium">${career.paid.toFixed(2)}</span>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">Rounds</h2>
          <span className="text-xs text-ink-faint">{filtered.length}</span>
        </div>
        {!ready ? null : filtered.length === 0 ? (
          <div className="card text-ink-muted text-center py-8 text-sm">
            {filter === 'all' ? 'No rounds yet. Tap + to start.' : `No ${filter} rounds.`}
          </div>
        ) : (
          <ul className="card divide-y divide-line py-0">
            {filtered.map((r) => {
              const total = (r.payouts ?? []).reduce((s, p) => s + p.amount, 0) || 0;
              return (
                <li key={r.id}>
                  <Link href={`/round/${r.id}`} className="row">
                    <div className="row-icon"><Flag aria-hidden className="w-5 h-5" strokeWidth={1.75} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{r.course || 'Untitled'}</div>
                      <div className="text-xs text-ink-muted capitalize mt-0.5">
                        {new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {r.format.type} · {r.players.length}p
                      </div>
                    </div>
                    <div className="text-right">
                      {total > 0 ? (
                        <div className={`font-medium ${r.settled ? 'text-ink-muted line-through' : 'text-ink'}`}>
                          ${total.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-xs text-ink-faint">No results</div>
                      )}
                      <div className={`text-[10px] uppercase tracking-wider mt-0.5 ${r.settled ? 'text-accent' : r.results ? 'text-amber' : 'text-ink-faint'}`}>
                        {r.settled ? 'Settled' : r.results ? 'Pending' : 'Open'}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
