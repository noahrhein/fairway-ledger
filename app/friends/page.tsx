'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { deleteFriend, getFriends, saveFriend } from '../../lib/friends';
import type { Friend } from '../../types';
import { YOU_ID } from '../../types';
import { User } from 'lucide-react';

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [ready, setReady] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [venmo, setVenmo] = useState('');

  useEffect(() => {
    setFriends(getFriends());
    setReady(true);
  }, []);

  function refresh() { setFriends(getFriends()); }

  function handleAdd() {
    if (!name.trim()) return;
    saveFriend({
      id: crypto.randomUUID(),
      name: name.trim(),
      venmoHandle: venmo.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setName(''); setVenmo(''); setAdding(false); refresh();
  }

  function handleDelete(id: string) {
    if (id === YOU_ID) return;
    if (confirm('Remove this friend?')) {
      deleteFriend(id);
      refresh();
    }
  }

  function updateFriend(f: Friend, patch: Partial<Friend>) {
    saveFriend({ ...f, ...patch });
    refresh();
  }

  return (
    <main className="space-y-6">
      <header className="pt-1 flex items-center justify-between">
        <div>
          <div className="eyebrow text-ink-muted/80">Fairway</div>
          <h1 className="text-2xl font-medium tracking-tight">Friends</h1>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="w-10 h-10 rounded-full bg-ink text-bg flex items-center justify-center text-xl shadow-pill"
          aria-label="Add friend"
        >
          +
        </button>
      </header>

      {adding && (
        <section className="card space-y-2">
          <input
            autoFocus
            className="input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Venmo handle (optional)"
            value={venmo}
            onChange={(e) => setVenmo(e.target.value)}
          />
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setAdding(false); setName(''); setVenmo(''); }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAdd} disabled={!name.trim()} className="btn-primary flex-1">Save</button>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">All</h2>
          <span className="text-xs text-ink-faint">{friends.length}</span>
        </div>
        {!ready ? null : (
          <ul className="card divide-y divide-line py-0">
            {friends.map((f) => (
              <FriendRow
                key={f.id}
                friend={f}
                onDelete={() => handleDelete(f.id)}
                onUpdate={(patch) => updateFriend(f, patch)}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function FriendRow({ friend, onDelete, onUpdate }: { friend: Friend; onDelete: () => void; onUpdate: (patch: Partial<Friend>) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(friend.name);
  const [venmo, setVenmo] = useState(friend.venmoHandle ?? '');
  const isYou = friend.id === YOU_ID;
  const initial = friend.name.charAt(0).toUpperCase();

  function save() {
    if (!name.trim()) return;
    onUpdate({ name: name.trim(), venmoHandle: venmo.trim() || undefined });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="py-3 first:pt-3 last:pb-3 space-y-2">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" value={venmo} onChange={(e) => setVenmo(e.target.value)} placeholder="Venmo handle" />
        <div className="flex gap-2">
          <button onClick={() => { setEditing(false); setName(friend.name); setVenmo(friend.venmoHandle ?? ''); }} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} className="btn-primary flex-1">Save</button>
        </div>
      </li>
    );
  }

  return (
    <li className="row">
      <div className="row-icon">{isYou ? <User aria-hidden className="w-5 h-5" strokeWidth={1.75} /> : initial}</div>
      <div className="min-w-0 flex-1">
        <div className={`font-medium truncate ${isYou ? 'text-accent' : ''}`}>{friend.name}</div>
        <div className="text-xs text-ink-muted mt-0.5">
          {friend.venmoHandle ? `@${friend.venmoHandle.replace(/^@/, '')}` : 'No Venmo'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setEditing(true)} className="text-xs text-ink-muted hover:text-ink">Edit</button>
        {!isYou && (
          <button onClick={onDelete} className="text-xs text-ink-faint hover:text-red-400">Remove</button>
        )}
      </div>
    </li>
  );
}
