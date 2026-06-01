'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  addSideBet,
  deleteRound,
  deleteSideBet,
  getRound,
  getCurrentUser,
} from '../../../../lib/db';
import type { Round } from '../../../../types';
import { Share2, Check, Plus } from 'lucide-react';

export default function RoundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [round, setRound] = useState<Round | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { void refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function refresh() {
    const [r, user] = await Promise.all([getRound(id), getCurrentUser()]);
    setRound(r);
    setUserId(user?.id ?? null);
    setReady(true);
  }

  if (!ready) return null;
  if (!round) {
    return (
      <main className="space-y-4">
        <Link href="/app" className="btn-ghost">← Home</Link>
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
        : fmt.type === 'wolf'
          ? `$${fmt.stakePerPoint} per point`
          : `$${fmt.buyIn} buy-in · winner takes all`;

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
        <Link href="/app" className="btn-ghost -ml-3 mb-1">← Home</Link>
      </header>

      <section className="card-hero">
        <div className="flex items-start gap-4">
          <ClubCrest course={round.course} />
          <div className="min-w-0 flex-1">
            <div className="eyebrow text-ink-muted/70 capitalize">{fmt.type === 'match' ? 'Match Play' : fmt.type}</div>
            <h1 className="mt-1 text-3xl font-medium tracking-tight truncate">{round.course}</h1>
            <div className="mt-1 text-sm text-ink-muted">
              {new Date(round.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="mt-3 text-xs text-ink-muted">{stakeSummary}</div>
          </div>
        </div>
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

      <SideBetsSection round={round} isOwner={isOwner} onChange={refresh} />

      <div className="space-y-2">
        {!round.results ? (
          isOwner ? (
            <Link href={`/app/round/${round.id}/score`} className="btn-primary w-full">Enter results</Link>
          ) : (
            <p className="text-sm text-ink-muted text-center py-4">Waiting for the host to enter results.</p>
          )
        ) : (
          <Link href={`/app/round/${round.id}/settle`} className="btn-primary w-full">View payouts</Link>
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
              router.push('/app');
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

function ClubCrest({ course }: { course: string }) {
  const initials =
    (course || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('') || '?';
  return (
    <div
      aria-hidden
      className="shrink-0 w-16 h-16 rounded-full flex items-center justify-center display font-semibold text-xl text-rolex-gold border border-rolex-gold/40 bg-rolex/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      {initials}
    </div>
  );
}

function SideBetsSection({
  round,
  isOwner,
  onChange,
}: {
  round: Round;
  isOwner: boolean;
  onChange: () => void | Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [desc, setDesc] = useState('');
  const [fromId, setFromId] = useState<string>(round.players[0]?.id ?? '');
  const [toId, setToId] = useState<string>(round.players[1]?.id ?? '');
  const [amount, setAmount] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const sideBets = round.sideBets ?? [];

  function name(id: string) {
    return round.players.find((p) => p.id === id)?.name ?? '?';
  }

  async function handleAdd() {
    const amt = Number(amount);
    if (!fromId || !toId || fromId === toId || !Number.isFinite(amt) || amt <= 0) return;
    setBusy(true);
    await addSideBet({
      roundId: round.id,
      description: desc.trim(),
      fromPlayerId: fromId,
      toPlayerId: toId,
      amount: amt,
    });
    setBusy(false);
    setAdding(false);
    setDesc('');
    setAmount('');
    await onChange();
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this side bet?')) return;
    await deleteSideBet(id, round.id);
    await onChange();
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow">Side bets</h2>
        {isOwner && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-accent hover:text-accent-dim inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} /> Add
          </button>
        )}
      </div>

      {sideBets.length === 0 && !adding && (
        <div className="card text-center text-ink-muted py-4 text-xs">
          {isOwner ? 'Add a closest-to-pin, longest-drive, or any extra wager.' : 'No side bets.'}
        </div>
      )}

      {sideBets.length > 0 && (
        <ul className="card divide-y divide-line py-0">
          {sideBets.map((sb) => (
            <li key={sb.id} className="row items-start py-3 first:pt-3 last:pb-3">
              <div className="min-w-0 flex-1">
                {sb.description && (
                  <div className="font-medium truncate">{sb.description}</div>
                )}
                <div className="text-xs text-ink-muted mt-0.5">
                  {name(sb.fromPlayerId)} <span className="text-ink-faint">→</span> {name(sb.toPlayerId)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-medium">${sb.amount.toFixed(2)}</div>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(sb.id)}
                    className="text-xs text-ink-faint hover:text-red-400 mt-0.5"
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding && isOwner && (
        <div className="card space-y-2">
          <input
            autoFocus
            className="input"
            placeholder="Description (e.g. closest to pin #7)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label text-xs">From</label>
              <select className="input" value={fromId} onChange={(e) => setFromId(e.target.value)}>
                {round.players.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">To</label>
              <select className="input" value={toId} onChange={(e) => setToId(e.target.value)}>
                {round.players.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label text-xs">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              className="input"
              placeholder="5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {fromId === toId && (
            <p className="text-xs text-red-400">Pick two different players.</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setAdding(false); setDesc(''); setAmount(''); }}
              className="btn-secondary flex-1"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={busy || fromId === toId || !amount || Number(amount) <= 0}
              className="btn-primary flex-1"
            >
              {busy ? 'Adding…' : 'Save bet'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
