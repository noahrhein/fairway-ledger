'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flag, Trophy, Users } from 'lucide-react';

const tabs = [
  { href: '/app', label: 'Home', Icon: Flag },
  { href: '/app/leaderboard', label: 'Leaderboard', Icon: Trophy },
  { href: '/app/friends', label: 'Friends', Icon: Users },
] as const;

/**
 * The tab bar is only relevant inside the signed-in app shell. It's
 * hidden on the landing, auth, onboarding, and share routes.
 */
export function TabBar() {
  const pathname = usePathname() ?? '/';
  const isInApp = pathname === '/app' || pathname.startsWith('/app/');
  if (!isInApp) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto max-w-[480px] px-4 pb-4 pt-2">
        <div className="flex items-center justify-around rounded-full border border-line bg-bg-elevated/95 backdrop-blur shadow-pill px-2 py-2">
          {tabs.map((t) => {
            const active = t.href === '/app' ? pathname === '/app' : pathname.startsWith(t.href);
            const Icon = t.Icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                prefetch={false}
                className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2 text-xs font-medium transition ${
                  active ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Icon aria-hidden className="w-4 h-4" strokeWidth={2} />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
