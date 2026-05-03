import type { Round } from '../types';

const KEY = 'fairway:rounds';

function read(): Round[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Round[]) : [];
  } catch {
    return [];
  }
}

function write(rounds: Round[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(rounds));
}

export function getRounds(): Round[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRound(id: string): Round | null {
  return read().find((r) => r.id === id) ?? null;
}

export function saveRound(round: Round): void {
  const rounds = read();
  const idx = rounds.findIndex((r) => r.id === round.id);
  if (idx >= 0) rounds[idx] = round;
  else rounds.push(round);
  write(rounds);
}

export function deleteRound(id: string): void {
  write(read().filter((r) => r.id !== id));
}
