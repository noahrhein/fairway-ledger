'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { Flag } from 'lucide-react';

export default function LandingPage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setSignedIn(!!user);
    })();
  }, []);

  return (
    <div className="-mx-4 -my-6 -mb-32">
      <TopBar signedIn={signedIn} />

      {/* Hero */}
      <section className="px-5 pt-16 pb-20 text-center max-w-[480px] mx-auto">
        <div className="eyebrow text-rolex-gold/80">Fairway · Est. 2026</div>
        <h1 className="mt-4 serif text-[44px] leading-[1.05] font-medium tracking-tight">
          Settle the bet<br />
          before you leave<br />
          <span className="text-rolex-gold">the 19th hole.</span>
        </h1>
        <p className="mt-5 text-ink-muted text-base leading-relaxed max-w-[360px] mx-auto">
          Track Nassau, Skins, Wolf and Match Play with your foursome. Side bets, share links, and instant Venmo payouts.
        </p>
        <div className="mt-8 flex flex-col gap-3 items-center">
          <Link
            href={signedIn ? '/app' : '/login'}
            className="btn-primary inline-flex items-center gap-2 px-7"
          >
            {signedIn ? 'Open Fairway' : 'Get started — it\'s free'}
          </Link>
          {!signedIn && (
            <Link href="/login" className="text-xs text-ink-faint hover:text-ink">
              Already have an account? <span className="text-ink-muted underline-offset-2 hover:underline">Sign in</span>
            </Link>
          )}
        </div>

        {/* Hero card preview */}
        <div className="mt-14 mx-auto max-w-[320px]">
          <HeroCardMockup />
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-16 max-w-[480px] mx-auto">
        <div className="text-center mb-10">
          <div className="eyebrow text-ink-muted">How it works</div>
          <h2 className="mt-3 serif text-3xl font-medium">Three steps to settled.</h2>
        </div>
        <ol className="space-y-5">
          <Step n={1} title="Set the stakes" body="Pick a format and a buy-in. Add your group from your phonebook or search by name." />
          <Step n={2} title="Play the round" body="Add side bets as they happen — closest to pin, longest drive, whatever you want." />
          <Step n={3} title="Settle on Venmo" body="Fairway calculates who owes whom. One tap opens Venmo with the amount pre-filled." />
        </ol>
      </section>

      {/* Formats */}
      <section className="px-5 py-16 max-w-[480px] mx-auto">
        <div className="text-center mb-8">
          <div className="eyebrow text-ink-muted">Game formats</div>
          <h2 className="mt-3 serif text-3xl font-medium">Four ways to bet.</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormatCard title="Nassau" sub="Front 9 · Back 9 · Total" />
          <FormatCard title="Skins" sub="Win the hole, win the skin" />
          <FormatCard title="Wolf" sub="Pick your partner each tee" />
          <FormatCard title="Match" sub="Heads-up, winner takes all" />
        </div>
        <p className="mt-6 text-xs text-ink-faint text-center">
          Plus unlimited side bets per round.
        </p>
      </section>

      {/* Final CTA */}
      <section className="px-5 pt-10 pb-20 text-center max-w-[480px] mx-auto">
        <Flag aria-hidden className="w-9 h-9 mx-auto text-rolex-gold" strokeWidth={1.5} />
        <h2 className="mt-4 serif text-3xl font-medium">Tee off when you're ready.</h2>
        <p className="mt-3 text-sm text-ink-muted">Sign in with your email — no password.</p>
        <Link
          href={signedIn ? '/app' : '/login'}
          className="mt-6 btn-primary inline-flex px-7"
        >
          {signedIn ? 'Open Fairway' : 'Get started'}
        </Link>
      </section>

      <footer className="px-5 pb-10 pt-6 border-t border-line/60 text-center">
        <div className="text-xs text-ink-faint">
          Fairway Ledger · Built for friends, not casinos.
        </div>
      </footer>
    </div>
  );
}

function TopBar({ signedIn }: { signedIn: boolean | null }) {
  return (
    <header className="px-5 py-4 flex items-center justify-between max-w-[640px] mx-auto">
      <Link href="/" className="flex items-center gap-2">
        <Flag aria-hidden className="w-5 h-5 text-rolex-gold" strokeWidth={1.75} />
        <span className="serif text-lg font-semibold tracking-tight">Fairway</span>
      </Link>
      <nav className="flex items-center gap-2">
        {signedIn ? (
          <Link
            href="/app"
            className="text-xs px-4 py-2 rounded-full bg-ink text-bg font-medium"
          >
            Open app →
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="text-xs px-3 py-2 text-ink-muted hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="text-xs px-4 py-2 rounded-full bg-ink text-bg font-medium"
            >
              Get started
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="card flex gap-4">
      <div className="serif text-rolex-gold text-2xl font-semibold w-7 leading-none mt-0.5">
        {n}.
      </div>
      <div>
        <div className="font-medium text-ink">{title}</div>
        <div className="mt-1 text-sm text-ink-muted leading-relaxed">{body}</div>
      </div>
    </li>
  );
}

function FormatCard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="card hover:border-line-strong transition">
      <div className="font-medium text-ink">{title}</div>
      <div className="mt-1 text-xs text-ink-muted">{sub}</div>
    </div>
  );
}

/** A scaled-down preview of the Rolex-green money hero. */
function HeroCardMockup() {
  return (
    <div className="card-money pointer-events-none select-none">
      <div className="relative z-10">
        <div className="eyebrow text-rolex-ink/60">Career earnings</div>
        <div className="mt-2 serif text-5xl font-medium leading-none text-rolex-gold">
          +$284
        </div>
        <div className="mt-2 text-xs text-rolex-ink/70">8 rounds on the books</div>
        <Flag aria-hidden className="absolute right-0 -top-1 w-6 h-6 text-rolex-gold/40" strokeWidth={1.5} />
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-rolex-dim/60 border border-rolex-edge/30 px-3 py-1.5">
          <span className="text-[9px] uppercase tracking-wider text-rolex-ink/50">Won</span>
          <span className="text-xs font-medium text-rolex-ink">$412</span>
          <span className="text-rolex-ink/30">·</span>
          <span className="text-[9px] uppercase tracking-wider text-rolex-ink/50">Paid</span>
          <span className="text-xs font-medium text-rolex-ink">$128</span>
        </div>
      </div>
    </div>
  );
}

