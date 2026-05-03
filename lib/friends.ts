import type { Friend } from '../types';
import { YOU_ID } from '../types';

const KEY = 'fairway:friends';

function read(): Friend[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Friend[]) : [];
  } catch {
    return [];
  }
}

function write(friends: Friend[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(friends));
}

function ensureSelf(list: Friend[]): Friend[] {
  if (list.find((f) => f.id === YOU_ID)) return list;
  const self: Friend = {
    id: YOU_ID,
    name: 'You',
    createdAt: new Date().toISOString(),
  };
  const next = [self, ...list];
  write(next);
  return next;
}

export function getFriends(): Friend[] {
  return ensureSelf(read()).sort((a, b) => {
    if (a.id === YOU_ID) return -1;
    if (b.id === YOU_ID) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function getFriend(id: string): Friend | null {
  return read().find((f) => f.id === id) ?? null;
}

export function saveFriend(friend: Friend): void {
  const list = read();
  const idx = list.findIndex((f) => f.id === friend.id);
  if (idx >= 0) list[idx] = friend;
  else list.push(friend);
  write(list);
}

export function deleteFriend(id: string): void {
  if (id === YOU_ID) return;
  write(read().filter((f) => f.id !== id));
}

export function findOrCreateByName(name: string, venmoHandle?: string): Friend {
  const list = read();
  const existing = list.find((f) => f.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (existing) {
    if (venmoHandle && !existing.venmoHandle) {
      existing.venmoHandle = venmoHandle;
      saveFriend(existing);
    }
    return existing;
  }
  const created: Friend = {
    id: crypto.randomUUID(),
    name: name.trim(),
    venmoHandle: venmoHandle?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  list.push(created);
  write(list);
  return created;
}
