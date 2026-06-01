'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getRounds, getCurrentUser } from '../../lib/db';
import { computeLeaderboard } from '../../lib/leaderboard';
import type { Round } from '../../types';
import { Flag, Plus } from 'lucide-react';

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

  const netSign = career ? (career.net > 0 ? '+' : career.net < 0 ? '−' : '') : '';
  const netColor =
    career && career.net > 0 ? 'text-rolex-gold'
    : career && career.net < 0 ? 'text-loss'
    : 'text-rolex-ink';

  return (
    <main className="space-y-6">
      <header className="pt-1 flex items-center justify-between">
        <div>
          <div className="eyebrow text-ink-muted/80">Fairway</div>
          <h1 className="text-2xl font-medium tracking-tight">Ledger</h1>
        </div>
        <Link
          href="/app/round/new"
          className="w-10 h-10 rounded-full bg-ink text-bg flex items-center justify-center shadow-pill"
          aria-label="New round"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
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

      {/* Career earnings — Rolex green ledger hero */}
      <section className="card-money">
        <div className="relative z-10">
          <div className="eyebrow text-rolex-ink/60">Career earnings</div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className={`serif text-6xl font-medium leading-none ${netColor}`}>
              {netSign}${ready ? Math.abs(career?.net ?? 0).toFixed(2) : '—'}
            </span>
          </div>
          <div className="mt-3 text-sm text-rolex-ink/70">
            {!career
              ? 'No rounds played yet.'
              : `${career.rounds} round${career.rounds === 1 ? '' : 's'} on the books`}
          </div>
          <Flag aria-hidden className="absolute right-1 -top-2 w-7 h-7 text-rolex-gold/40" strokeWidth={1.5} />

          {career && (
            <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-rolex-dim/60 border border-rolex-edge/30 px-4 py-2 backdrop-blur-sm">
              <span className="text-[10px] uppercase tracking-wider text-rolex-ink/50">Won</span>
              <span className="text-sm font-medium text-rolex-ink">${career.received.toFixed(2)}</span>
              <span className="text-rolex-ink/30">·</span>
              <span className="text-[10px] uppercase tracking-wider text-rolex-ink/50">Paid</span>
              <span className="text-sm font-medium text-rolex-ink">${career.paid.toFixed(2)}</span>
            </div>
          )}
        </div>
      </section>

      {/* Rounds — scoreboard cards */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">Rounds</h2>
          <span className="text-xs text-ink-faint">{filtered.length}</span>
        </div>
        {!ready ? null : filtered.length === 0 ? (
          <div className="card text-center py-10 space-y-2">
            <Flag aria-hidden className="w-8 h-8 mx-auto text-ink-faint" strokeWidth={1.5} />
            <div className="text-sm text-ink-muted">
              {filter === 'all' ? (
                <>
                  <div className="font-medium text-ink">Tee off when you're ready</div>
                  <div className="text-xs text-ink-faint mt-1">Tap + to start your first round.</div>
                </>
              ) : (
                `No ${filter} rounds.`
              )}
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((r) => (
              <ScoreboardRow key={r.id} round={r} userId={userId} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function ScoreboardRow({ round, userId }: { round: Round; userId: string | null }) {
  const total = (round.payouts ?? []).reduce((s, p) => s + p.amount, 0) || 0;
  const dateStr = new Date(round.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  // Compute viewer's personal net in this round if they're a player.
  const viewerNet = useMemo(() => {
    if (!userId) return null;
    const me = round.players.find((p) => p.userId === userId);
    if (!me) return null;
    let net = 0;
    for (const p of round.payouts ?? []) {
      if (p.fromPlayerId === me.id) net -= p.amount;
      if (p.toPlayerId === me.id) net += p.amount;
    }
    return net;
  }, [round, userId]);

  const status = round.settled ? 'settled' : round.results ? 'pending' : 'open';
  const statusLabel = round.settled ? 'Squared up' : round.results ? 'Awaiting payout' : 'In play';

  return (
    <li>
      <Link
        href={`/app/round/${round.id}`}
        className="block card hover:border-line-strong transition group"
      >
        <div className="flex items-start gap-3">
          {/* Course crest */}
          <CourseCrest course={round.course} />

          <div className="min-w-0 flex-1">
            <div className="eyebrow text-ink-faint text-[10px]">
              {dateStr} · {round.format.type === 'match' ? 'Match' : round.format.type}
            </div>
            <div className="mt-0.5 font-medium text-ink truncate">{round.course || 'Untitled'}</div>

            {/* Player initial stack */}
            <div className="mt-2 flex items-center gap-2">
              <PlayerStack round={round} />
              <span className="text-[11px] text-ink-faint">{round.players.length} players</span>
            </div>
          </div>

          <div className="text-right shrink-0">
            {viewerNet !== null && total > 0 ? (
              <div className={`serif text-2xl font-medium leading-none ${
                viewerNet > 0 ? 'text-accent' : viewerNet < 0 ? 'text-loss' : 'text-ink-muted'
              }`}>
                {viewerNet > 0 ? '+' : viewerNet < 0 ? '−' : ''}${Math.abs(viewerNet).toFixed(0)}
              </div>
            ) : total > 0 ? (
              <div className="serif text-2xl font-medium leading-none text-ink-muted">
                ${total.toFixed(0)}
              </div>
            ) : (
              <div className="text-xs text-ink-faint italic">No results</div>
            )}
            <div className={`mt-2 status-pill status-${status} justify-end`}>
              <span className={`status-dot status-dot-${status}`} />
              {statusLabel}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

function CourseCrest({ course }: { course: string }) {
  // Pull up to two initials from the course name — feels like a club monogram.
  const initials = (course || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?';
  return (
    <div
      className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center serif font-semibold text-sm text-rolex-gold border border-rolex-gold/30 bg-rolex/40"
      aria-hidden
    >
      {initials}
    </div>
  );
}

function PlayerStack({ round }: { round: Round }) {
  // Show up to 4 player initials as overlapping circles.
  const players = round.players.slice(0, 4);
  return (
    <div className="flex -space-x-1.5">
      {players.map((p) => (
        <div
          key={p.id}
          className="w-5 h-5 rounded-full bg-bg-sunken border border-line-strong flex items-center justify-center text-[9px] font-medium text-ink-muted"
          title={p.name}
        >
          {p.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
