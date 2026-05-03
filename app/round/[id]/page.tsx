'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { deleteRound, getRound } from '../../../lib/storage';
import type { Round } from '../../../types';
import { Flag } from 'lucide-react';

export default function RoundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [round, setRound] = useState<Round | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRound(getRound(id));
    setReady(true);
  }, [id]);

  if (!ready) return null;
  if (!round) {
    return (
      <main className="space-y-4">
        <Link href="/" className="btn-ghost">← Home</Link>
        <p className="text-ink-muted">Round not found.</p>
      </main>
    );
  }

  const fmt = round.format;
  const stakeSummary =
    fmt.type === 'nassau'
      ? `F9 $${fmt.stakes.f9} · B9 $${fmt.stakes.b9} · Total $${fmt.stakes.total}`
      : fmt.type === 'skins'
        ? `$${fmt.stakePerSkin} per skin`
        : `$${fmt.stakePerPoint} per point`;

  return (
    <main className="space-y-6">
      <header>
        <Link href="/" className="btn-ghost -ml-3 mb-1">← Home</Link>
      </header>

      <section className="card-hero">
        <div className="eyebrow text-ink-muted/70 capitalize">{fmt.type}</div>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">{round.course}</h1>
        <div className="mt-1 text-sm text-ink-muted">
          {new Date(round.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="mt-4 text-xs text-ink-muted">{stakeSummary}</div>
        <Flag aria-hidden className="absolute right-5 top-5 w-6 h-6 text-ink-muted" strokeWidth={1.75} />
      </section>

      <section>
        <h2 className="eyebrow mb-2">Players</h2>
        <ul className="card divide-y divide-line">
          {round.players.map((p, i) => (
            <li key={p.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
              <span className={i === 0 ? 'font-medium text-accent' : ''}>{p.name}</span>
              {p.venmoHandle && (
                <span className="text-xs text-ink-muted">@{p.venmoHandle.replace(/^@/, '')}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {!round.results ? (
        <Link href={`/round/${round.id}/score`} className="btn-primary w-full">Enter results</Link>
      ) : (
        <Link href={`/round/${round.id}/settle`} className="btn-primary w-full">View payouts</Link>
      )}

      <button
        onClick={() => {
          if (confirm('Delete this round?')) {
            deleteRound(round.id);
            router.push('/');
          }
        }}
        className="text-xs text-ink-faint hover:text-red-400 w-full text-center pt-4"
      >
        Delete round
      </button>
    </main>
  );
}
