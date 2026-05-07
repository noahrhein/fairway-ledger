'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getRound, saveRoundResults } from '../../../../lib/db';
import { calculateNassau } from '../../../../lib/betting/nassau';
import { calculateSkins } from '../../../../lib/betting/skins';
import { calculateWolf } from '../../../../lib/betting/wolf';
import { simplifyDebts } from '../../../../lib/betting/settle';
import type { Round, RoundResults } from '../../../../types';

export default function ScoreEntryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [round, setRound] = useState<Round | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      setRound(await getRound(id));
      setReady(true);
    })();
  }, [id]);

  if (!ready) return null;
  if (!round) return <p className="text-ink-muted">Round not found.</p>;

  return <ScoreEntry round={round} onSaved={() => router.push(`/round/${round.id}/settle`)} />;
}

function ScoreEntry({ round, onSaved }: { round: Round; onSaved: () => void }) {
  const fmt = round.format;
  const initial = useMemo<RoundResults>(() => {
    if (round.results) return round.results;
    if (fmt.type === 'nassau') {
      const scores: Record<string, { f9: number; b9: number; total: number }> = {};
      for (const p of round.players) scores[p.id] = { f9: 0, b9: 0, total: 0 };
      return { type: 'nassau', scores };
    }
    if (fmt.type === 'skins') {
      const m: Record<string, number> = {};
      for (const p of round.players) m[p.id] = 0;
      return { type: 'skins', skinsByPlayer: m };
    }
    const m: Record<string, number> = {};
    for (const p of round.players) m[p.id] = 0;
    return { type: 'wolf', pointsByPlayer: m };
  }, [round, fmt.type]);

  const [results, setResults] = useState<RoundResults>(initial);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    let debts;
    let toSave: RoundResults = results;
    if (results.type === 'nassau' && fmt.type === 'nassau') {
      const scores = Object.fromEntries(
        Object.entries(results.scores).map(([k, v]) => [k, { ...v, total: v.total || v.f9 + v.b9 }]),
      );
      debts = calculateNassau(round.players, scores, fmt.stakes);
      toSave = { ...results, scores };
    } else if (results.type === 'skins' && fmt.type === 'skins') {
      debts = calculateSkins(round.players, results.skinsByPlayer, fmt.stakePerSkin);
    } else if (results.type === 'wolf' && fmt.type === 'wolf') {
      debts = calculateWolf(round.players, results.pointsByPlayer, fmt.stakePerPoint);
    } else {
      return;
    }
    const payouts = simplifyDebts(debts, round.players);
    setBusy(true);
    await saveRoundResults(
      round.id,
      toSave,
      payouts.map((p) => ({ fromPlayerId: p.fromPlayerId, toPlayerId: p.toPlayerId, amount: p.amount })),
    );
    setBusy(false);
    onSaved();
  }

  return (
    <main className="space-y-6">
      <header>
        <Link href={`/round/${round.id}`} className="btn-ghost -ml-3 mb-1">← {round.course}</Link>
        <h1 className="text-3xl font-medium tracking-tight">Enter results</h1>
      </header>

      {results.type === 'nassau' && fmt.type === 'nassau' && (
        <div className="space-y-3">
          {round.players.map((p, i) => {
            const s = results.scores[p.id]!;
            return (
              <div key={p.id} className="card space-y-2">
                <div className={`font-medium ${i === 0 ? 'text-accent' : ''}`}>{p.name}</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['f9', 'b9', 'total'] as const).map((seg) => (
                    <div key={seg}>
                      <label className="label uppercase text-xs">{seg}</label>
                      <input
                        type="number"
                        className="input"
                        value={s[seg] || ''}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setResults({
                            ...results,
                            scores: { ...results.scores, [p.id]: { ...s, [seg]: v } },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <p className="text-xs text-ink-faint">Leave Total blank to auto-sum F9 + B9.</p>
        </div>
      )}

      {results.type === 'skins' && (
        <div className="space-y-3">
          {round.players.map((p, i) => (
            <div key={p.id} className="card flex items-center justify-between">
              <div className={`font-medium ${i === 0 ? 'text-accent' : ''}`}>{p.name}</div>
              <input
                type="number"
                className="input max-w-[100px]"
                placeholder="Skins"
                value={results.skinsByPlayer[p.id] || ''}
                onChange={(e) =>
                  setResults({
                    ...results,
                    skinsByPlayer: { ...results.skinsByPlayer, [p.id]: Number(e.target.value) },
                  })
                }
              />
            </div>
          ))}
        </div>
      )}

      {results.type === 'wolf' && (
        <div className="space-y-3">
          {round.players.map((p, i) => (
            <div key={p.id} className="card flex items-center justify-between">
              <div className={`font-medium ${i === 0 ? 'text-accent' : ''}`}>{p.name}</div>
              <input
                type="number"
                className="input max-w-[100px]"
                placeholder="Points"
                value={results.pointsByPlayer[p.id] || ''}
                onChange={(e) =>
                  setResults({
                    ...results,
                    pointsByPlayer: { ...results.pointsByPlayer, [p.id]: Number(e.target.value) },
                  })
                }
              />
            </div>
          ))}
        </div>
      )}

      <button onClick={handleSave} disabled={busy} className="btn-primary w-full">
        {busy ? 'Saving…' : 'Calculate payouts'}
      </button>
    </main>
  );
}
