'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  createRound,
  findOrCreateFriendByName,
  getCurrentUser,
  getFriends,
  getProfile,
  saveFriend,
} from '../../../../lib/db';
import type { BetFormat, Friend } from '../../../../types';

type FormatType = 'nassau' | 'skins' | 'wolf' | 'match';
type Slot = { friendId: string | null; userId: string | null; name: string; venmo: string };

export default function NewRoundPage() {
  const router = useRouter();
  const [course, setCourse] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [friends, setFriends] = useState<Friend[]>([]);
  const [slots, setSlots] = useState<Slot[]>([
    { friendId: null, userId: null, name: '', venmo: '' },
    { friendId: null, userId: null, name: '', venmo: '' },
  ]);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [formatType, setFormatType] = useState<FormatType>('nassau');
  const [nassauStakes, setNassauStakes] = useState({ f9: 5, b9: 5, total: 10 });
  const [skinsStake, setSkinsStake] = useState(2);
  const [wolfStake, setWolfStake] = useState(1);
  const [matchBuyIn, setMatchBuyIn] = useState(20);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [list, profile, user] = await Promise.all([getFriends(), getProfile(), getCurrentUser()]);
      setFriends(list);
      // Always link slot 0 to the signed-in user, even if profile is missing.
      if (user) {
        setSlots((s) => s.map((slot, i) => i === 0
          ? {
              friendId: null,
              userId: user.id,
              name: profile?.displayName ?? slot.name,
              venmo: profile?.venmoHandle ?? slot.venmo,
            }
          : slot));
      }
    })();
  }, []);

  const isMatch = formatType === 'match';
  const maxPlayers = isMatch ? 2 : 4;
  const canSubmit =
    course.trim().length > 0 &&
    slots.length >= 2 &&
    (!isMatch || slots.length === 2) &&
    slots.every((s) => s.name.trim().length > 0) &&
    new Set(slots.map((s) => s.name.trim().toLowerCase())).size === slots.length &&
    !busy;

  function pickFormat(t: FormatType) {
    setFormatType(t);
    if (t === 'match' && slots.length > 2) {
      setSlots((s) => s.slice(0, 2));
    }
  }

  function updateSlot(i: number, patch: Partial<Slot>) {
    setSlots((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addSlot() {
    if (slots.length < maxPlayers) setSlots((s) => [...s, { friendId: null, userId: null, name: '', venmo: '' }]);
  }
  function removeSlot(i: number) {
    if (i === 0) return;
    setSlots((s) => s.filter((_, idx) => idx !== i));
  }
  function pickFriend(slotIdx: number, friend: Friend) {
    updateSlot(slotIdx, {
      friendId: friend.id,
      userId: friend.friendUserId ?? null,
      name: friend.name,
      venmo: friend.venmoHandle ?? '',
    });
    setPickerFor(null);
  }

  function buildFormat(): BetFormat {
    if (formatType === 'nassau') return { type: 'nassau', stakes: nassauStakes };
    if (formatType === 'skins') return { type: 'skins', stakePerSkin: skinsStake };
    if (formatType === 'match') return { type: 'match', buyIn: matchBuyIn };
    return { type: 'wolf', stakePerPoint: wolfStake };
  }

  async function handleCreate() {
    setBusy(true);
    // Ensure friend records exist for non-self slots
    for (let i = 1; i < slots.length; i++) {
      const s = slots[i]!;
      if (s.friendId) {
        await saveFriend({ id: s.friendId, name: s.name.trim(), venmoHandle: s.venmo.trim() || undefined });
      } else {
        await findOrCreateFriendByName(s.name, s.venmo.trim() || undefined);
      }
    }
    const round = await createRound({
      course: course.trim(),
      date,
      format: buildFormat(),
      players: slots.map((s) => ({
        name: s.name.trim(),
        venmoHandle: s.venmo.trim() || undefined,
        userId: s.userId,
      })),
    });
    setBusy(false);
    if (round) router.push(`/app/round/${round.id}`);
  }

  const usedFriendIds = new Set(slots.map((s) => s.friendId).filter(Boolean) as string[]);
  const availableFriends = friends.filter((f) => !usedFriendIds.has(f.id));

  return (
    <main className="space-y-6">
      <header>
        <Link href="/app" className="btn-ghost -ml-3 mb-1 px-3 py-2">← Home</Link>
        <h1 className="text-3xl font-medium tracking-tight">New round</h1>
      </header>

      <section className="space-y-3">
        <div>
          <label className="label">Course</label>
          <input className="input" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Pebble Beach" />
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">Players</h2>
          {slots.length < maxPlayers && (
            <button onClick={addSlot} className="text-xs text-accent hover:text-accent-dim">+ Add player</button>
          )}
        </div>
        {slots.map((slot, i) => (
          <div key={i} className="card space-y-2">
            <div className="flex items-center gap-2">
              <input
                className="input flex-1"
                placeholder={i === 0 ? 'You' : `Player ${i + 1}`}
                value={slot.name}
                onChange={(e) => updateSlot(i, { name: e.target.value, friendId: null })}
              />
              {i > 0 && availableFriends.length > 0 && (
                <button
                  onClick={() => setPickerFor(pickerFor === i ? null : i)}
                  className="shrink-0 text-xs px-3 py-2 rounded-xl border border-line bg-white/[0.03] hover:bg-white/[0.06] text-ink-muted"
                >
                  Pick
                </button>
              )}
              {i > 0 && (
                <button onClick={() => removeSlot(i)} className="text-ink-faint hover:text-ink px-2" aria-label="Remove">×</button>
              )}
            </div>
            {pickerFor === i && (
              <ul className="rounded-xl border border-line bg-bg-sunken divide-y divide-line max-h-56 overflow-auto">
                {availableFriends.map((f) => (
                  <li key={f.id}>
                    <button
                      onClick={() => pickFriend(i, f)}
                      className="w-full text-left px-3 py-2.5 hover:bg-white/[0.04] flex items-center justify-between"
                    >
                      <span>{f.name}</span>
                      {f.venmoHandle && <span className="text-xs text-ink-muted">@{f.venmoHandle.replace(/^@/, '')}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <input
              className="input"
              placeholder="Venmo handle (optional)"
              value={slot.venmo}
              onChange={(e) => updateSlot(i, { venmo: e.target.value })}
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow">Format</h2>
        <div className="seg-group">
          {(['nassau', 'skins', 'wolf', 'match'] as FormatType[]).map((t) => (
            <button
              key={t}
              onClick={() => pickFormat(t)}
              className={`seg capitalize ${formatType === t ? 'seg-active' : ''}`}
            >
              {t === 'match' ? 'Match' : t}
            </button>
          ))}
        </div>
        {isMatch && (
          <p className="text-xs text-ink-faint">Match play is heads-up — exactly 2 players, lowest score wins the buy-in.</p>
        )}

        {formatType === 'nassau' && (
          <div className="card grid grid-cols-3 gap-2">
            {(['f9', 'b9', 'total'] as const).map((seg) => (
              <div key={seg}>
                <label className="label uppercase text-xs">{seg}</label>
                <input
                  type="number"
                  className="input"
                  value={nassauStakes[seg]}
                  onChange={(e) => setNassauStakes({ ...nassauStakes, [seg]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
        )}
        {formatType === 'skins' && (
          <div className="card">
            <label className="label">Stake per skin ($)</label>
            <input type="number" className="input" value={skinsStake} onChange={(e) => setSkinsStake(Number(e.target.value))} />
          </div>
        )}
        {formatType === 'wolf' && (
          <div className="card">
            <label className="label">Stake per point ($)</label>
            <input type="number" className="input" value={wolfStake} onChange={(e) => setWolfStake(Number(e.target.value))} />
          </div>
        )}
        {formatType === 'match' && (
          <div className="card">
            <label className="label">Buy-in ($)</label>
            <input type="number" className="input" value={matchBuyIn} onChange={(e) => setMatchBuyIn(Number(e.target.value))} />
            <p className="text-xs text-ink-faint mt-1">Loser pays the winner this amount.</p>
          </div>
        )}
      </section>

      <button disabled={!canSubmit} onClick={handleCreate} className="btn-primary w-full">
        {busy ? 'Creating…' : 'Create round'}
      </button>
    </main>
  );
}
