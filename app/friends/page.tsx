'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteFriend,
  getFriends,
  saveFriend,
  getProfile,
  searchUsers,
  type UserSearchHit,
} from '../../lib/db';
import type { Friend, Profile } from '../../types';
import { Check, Search, User } from 'lucide-react';

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [venmo, setVenmo] = useState('');

  useEffect(() => { void refresh(); }, []);

  async function refresh() {
    const [list, prof] = await Promise.all([getFriends(), getProfile()]);
    setFriends(list);
    setProfile(prof);
    setReady(true);
  }

  async function handleAdd() {
    if (!name.trim()) return;
    await saveFriend({ name: name.trim(), venmoHandle: venmo.trim() || undefined });
    setName(''); setVenmo(''); setAdding(false);
    void refresh();
  }

  async function handleDelete(id: string) {
    if (confirm('Remove this friend?')) {
      await deleteFriend(id);
      void refresh();
    }
  }

  async function updateFriend(f: Friend, patch: Partial<Friend>) {
    await saveFriend({ id: f.id, name: patch.name ?? f.name, venmoHandle: patch.venmoHandle ?? f.venmoHandle });
    void refresh();
  }

  async function handleSignOut() {
    const res = await fetch('/auth/signout', { method: 'POST' });
    if (res.redirected) window.location.href = res.url;
    else window.location.href = '/login';
  }

  async function handleAddSearchHit(hit: UserSearchHit) {
    await saveFriend({ name: hit.displayName, friendUserId: hit.id });
    void refresh();
  }

  const linkedUserIds = useMemo(
    () => new Set(friends.map((f) => f.friendUserId).filter(Boolean) as string[]),
    [friends],
  );

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

      {profile && (
        <section className="card space-y-3">
          <div className="flex items-center gap-3">
            <div className="row-icon"><User aria-hidden className="w-5 h-5" strokeWidth={1.75} /></div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-accent">{profile.displayName}</div>
              <div className="text-xs text-ink-muted mt-0.5">
                {profile.venmoHandle ? `@${profile.venmoHandle.replace(/^@/, '')}` : 'No Venmo'}
              </div>
            </div>
            <a href="/onboarding" className="text-xs text-ink-muted hover:text-ink">Edit</a>
            <button onClick={handleSignOut} className="text-xs text-ink-faint hover:text-red-400 ml-2">Sign out</button>
          </div>
          {(profile.homeState || profile.handicap !== null && profile.handicap !== undefined || (profile.preferredGames && profile.preferredGames.length > 0)) && (
            <div className="flex flex-wrap gap-1.5 pl-12">
              {profile.homeState && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-bg-sunken text-ink-muted">{profile.homeState}</span>
              )}
              {profile.handicap !== null && profile.handicap !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-bg-sunken text-ink-muted">HCP {profile.handicap}</span>
              )}
              {(profile.preferredGames ?? []).map((g) => (
                <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent capitalize">{g}</span>
              ))}
            </div>
          )}
        </section>
      )}

      {adding && (
        <section className="card space-y-2">
          <input autoFocus className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Venmo handle (optional)" value={venmo} onChange={(e) => setVenmo(e.target.value)} />
          <p className="text-xs text-ink-faint">For people who aren't on Fairway yet. To link a real account, use search below.</p>
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setAdding(false); setName(''); setVenmo(''); }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAdd} disabled={!name.trim()} className="btn-primary flex-1">Save</button>
          </div>
        </section>
      )}

      <UserSearchSection
        linkedUserIds={linkedUserIds}
        onAdded={handleAddSearchHit}
      />

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">Phonebook</h2>
          <span className="text-xs text-ink-faint">{friends.length}</span>
        </div>
        {!ready ? null : friends.length === 0 ? (
          <div className="card text-ink-muted text-center py-8 text-sm">
            Add friends so you can pick them when starting a round.
          </div>
        ) : (
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
      <div className="row-icon">{initial}</div>
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate flex items-center gap-1.5">
          {friend.name}
          {friend.friendUserId && (
            <span title="Linked Fairway account" className="text-accent">
              <Check className="w-3.5 h-3.5 inline" strokeWidth={2.5} />
            </span>
          )}
        </div>
        <div className="text-xs text-ink-muted mt-0.5">
          {friend.venmoHandle ? `@${friend.venmoHandle.replace(/^@/, '')}` : friend.friendUserId ? 'On Fairway' : 'No Venmo'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setEditing(true)} className="text-xs text-ink-muted hover:text-ink">Edit</button>
        <button onClick={onDelete} className="text-xs text-ink-faint hover:text-red-400">Remove</button>
      </div>
    </li>
  );
}

function UserSearchSection({
  linkedUserIds,
  onAdded,
}: {
  linkedUserIds: Set<string>;
  onAdded: (hit: UserSearchHit) => void | Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<UserSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchUsers(trimmed);
      setHits(results);
      setSearching(false);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function handleAdd(hit: UserSearchHit) {
    await onAdded(hit);
    setJustAdded((s) => new Set(s).add(hit.id));
  }

  return (
    <section className="space-y-2">
      <h2 className="eyebrow">Find friends on Fairway</h2>
      <div className="card space-y-3">
        <div className="relative">
          <Search aria-hidden className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" strokeWidth={2} />
          <input
            className="input pl-9"
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {query.trim().length > 0 && query.trim().length < 2 && (
          <p className="text-xs text-ink-faint">Type at least 2 characters.</p>
        )}

        {query.trim().length >= 2 && (
          <>
            {searching && hits.length === 0 ? (
              <p className="text-xs text-ink-faint">Searching…</p>
            ) : hits.length === 0 ? (
              <p className="text-xs text-ink-faint">No Fairway users match "{query.trim()}".</p>
            ) : (
              <ul className="divide-y divide-line -mx-3">
                {hits.map((hit) => {
                  const alreadyLinked = linkedUserIds.has(hit.id) || justAdded.has(hit.id);
                  return (
                    <li key={hit.id} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="row-icon text-sm font-medium">
                        {hit.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{hit.displayName}</div>
                        {hit.homeState && (
                          <div className="text-xs text-ink-muted mt-0.5">{hit.homeState}</div>
                        )}
                      </div>
                      {alreadyLinked ? (
                        <span className="text-xs text-accent inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Added
                        </span>
                      ) : (
                        <button
                          onClick={() => void handleAdd(hit)}
                          className="text-xs px-3 py-1.5 rounded-full bg-ink text-bg font-medium"
                        >
                          Add
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
