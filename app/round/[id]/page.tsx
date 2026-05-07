'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { deleteRound, getRound, getCurrentUser } from '../../../lib/db';
import type { Round } from '../../../types';
import { Flag, Share2, Check } from 'lucide-react';

export default function RoundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [round, setRound] = useState<Round | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const [r, user] = await Promise.all([getRound(id), getCurrentUser()]);
      setRound(r);
      setUserId(user?.id ?? null);
      setReady(true);
    })();
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

  const isOwner = round.ownerId === userId;
  const fmt = round.format;
  const stakeSummary =
    fmt.type === 'nassau'
      ? `F9 $${fmt.stakes.f9} · B9 $${fmt.stakes.b9} · Total $${fmt.stakes.total}`
      : fmt.type === 'skins'
        ? `$${fmt.stakePerSkin} per skin`
        : `$${fmt.stakePerPoint} per point`;

  async function handleShare() {
    const url = `${window.location.origin}/share/${round!.shareToken}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${round!.course} – Fairway Ledger`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* user cancelled */ }
  }

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
          {round.players.map((p) => {
            const isMe = !!userId && p.userId === userId;
            const claimed = !!p.userId;
            return (
              <li key={p.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <span className={isMe ? 'font-medium text-accent' : ''}>{p.name}</span>
                <span className="text-xs text-ink-muted flex items-center gap-2">
                  {p.venmoHandle && <span>@{p.venmoHandle.replace(/^@/, '')}</span>}
                  {claimed && <span className="text-accent" title="Account linked"><Check className="w-3.5 h-3.5 inline" /></span>}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="space-y-2">
        {!round.results ? (
          isOwner ? (
            <Link href={`/round/${round.id}/score`} className="btn-primary w-full">Enter results</Link>
          ) : (
            <p className="text-sm text-ink-muted text-center py-4">Waiting for the host to enter results.</p>
          )
        ) : (
          <Link href={`/round/${round.id}/settle`} className="btn-primary w-full">View payouts</Link>
        )}

        <button onClick={handleShare} className="btn-secondary w-full inline-flex items-center justify-center gap-2">
          <Share2 className="w-4 h-4" strokeWidth={2} />
          {copied ? 'Link copied!' : 'Share with players'}
        </button>
      </div>

      {isOwner && (
        <button
          onClick={async () => {
            if (confirm('Delete this round?')) {
              await deleteRound(round.id);
              router.push('/');
            }
          }}
          className="text-xs text-ink-faint hover:text-red-400 w-full text-center pt-4"
        >
          Delete round
        </button>
      )}
    </main>
  );
}
