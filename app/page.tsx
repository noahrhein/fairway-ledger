'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { Flag, Check, ArrowRight } from 'lucide-react';

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

      {/* HERO */}
      <section className="px-5 pt-12 pb-8 max-w-[680px] mx-auto text-center md:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full bg-bg-elevated border border-line px-3 py-1 text-[11px] text-ink-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Bets, settled.
        </div>
        <h1 className="mt-6 display text-[44px] sm:text-[56px] md:text-[68px] leading-[1.02] text-ink">
          Settle the bet<br />
          before you leave<br />
          <span className="text-accent">the 19th hole.</span>
        </h1>
        <p className="mt-6 text-ink-muted text-base sm:text-lg leading-relaxed max-w-[480px] mx-auto">
          Track Nassau, Skins, Wolf, and Match Play with your foursome. Side bets, share links, and one-tap Venmo payouts.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href={signedIn ? '/app' : '/login'}
            className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-base"
          >
            {signedIn ? 'Open Fairway' : 'Get started'}
            <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
          </Link>
          {!signedIn && (
            <Link href="/login" className="text-xs text-ink-faint hover:text-ink">
              Already have an account? <span className="text-ink-muted underline-offset-2 hover:underline">Sign in</span>
            </Link>
          )}
        </div>
      </section>

      {/* PHONE TRIO */}
      <section className="px-5 py-10 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-3 gap-3 sm:gap-5 md:gap-8 items-end">
          <PhoneMockup tilt="left">
            <DashboardMock />
          </PhoneMockup>
          <PhoneMockup tilt="up">
            <RoundMock />
          </PhoneMockup>
          <PhoneMockup tilt="right">
            <SettleMock />
          </PhoneMockup>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-5 py-20 max-w-[680px] mx-auto">
        <div className="text-center mb-12">
          <div className="eyebrow text-ink-muted">How it works</div>
          <h2 className="mt-3 display text-[36px] sm:text-[44px] leading-tight">Three steps to settled.</h2>
        </div>
        <ol className="space-y-4">
          <Step n={1} title="Set the stakes" body="Pick a format and a buy-in. Pull in your group from your phonebook or search by name." />
          <Step n={2} title="Play the round" body="Add side bets as they happen — closest to pin, longest drive, whatever you want." />
          <Step n={3} title="Settle on Venmo" body="Fairway calculates who owes whom. One tap opens Venmo with the amount filled in." />
        </ol>
      </section>

      {/* FORMATS */}
      <section className="px-5 py-20 max-w-[680px] mx-auto">
        <div className="text-center mb-10">
          <div className="eyebrow text-ink-muted">Game formats</div>
          <h2 className="mt-3 display text-[36px] sm:text-[44px] leading-tight">Four ways to bet.</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormatCard title="Nassau" sub="Front · Back · Total" />
          <FormatCard title="Skins" sub="Win the hole, win the skin" />
          <FormatCard title="Wolf" sub="Pick your partner each tee" />
          <FormatCard title="Match" sub="Heads-up, winner takes all" />
        </div>
        <p className="mt-6 text-xs text-ink-faint text-center">
          Plus unlimited side bets per round.
        </p>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 pt-10 pb-20 text-center max-w-[600px] mx-auto">
        <Flag aria-hidden className="w-9 h-9 mx-auto text-accent" strokeWidth={1.5} />
        <h2 className="mt-5 display text-[32px] sm:text-[40px] leading-tight">Tee off when you're ready.</h2>
        <p className="mt-3 text-sm text-ink-muted">Sign in with your email — no password.</p>
        <Link
          href={signedIn ? '/app' : '/login'}
          className="mt-6 btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-base"
        >
          {signedIn ? 'Open Fairway' : 'Get started'}
          <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
        </Link>
      </section>

      <footer className="px-5 pb-10 pt-8 border-t border-line text-center">
        <div className="text-xs text-ink-faint">
          Fairway Ledger · Bets, settled.
        </div>
      </footer>
    </div>
  );
}

function TopBar({ signedIn }: { signedIn: boolean | null }) {
  return (
    <header className="px-5 py-4 flex items-center justify-between max-w-[1100px] mx-auto">
      <Link href="/" className="flex items-center gap-2">
        <span className="display text-lg text-ink">Fairway</span>
        <span className="w-1 h-1 rounded-full bg-accent" />
      </Link>
      <nav className="flex items-center gap-2">
        {signedIn ? (
          <Link href="/app" className="text-xs px-4 py-2 rounded-full bg-ink text-bg font-medium">
            Open app →
          </Link>
        ) : (
          <>
            <Link href="/login" className="text-xs px-3 py-2 text-ink-muted hover:text-ink">
              Sign in
            </Link>
            <Link href="/login" className="text-xs px-4 py-2 rounded-full bg-ink text-bg font-medium">
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
    <li className="card flex gap-4 items-start">
      <div className="display text-accent text-3xl w-9 leading-none mt-0.5 shrink-0">
        {String(n).padStart(2, '0')}
      </div>
      <div>
        <div className="font-semibold text-ink">{title}</div>
        <div className="mt-1 text-sm text-ink-muted leading-relaxed">{body}</div>
      </div>
    </li>
  );
}

function FormatCard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="card hover:border-line-strong transition">
      <div className="font-semibold text-ink">{title}</div>
      <div className="mt-1 text-xs text-ink-muted">{sub}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Phone mockups — flat-laid trio showing real-feeling app screens.
   Drawn entirely in CSS; no screenshots required.
   ────────────────────────────────────────────────────────────────────── */

function PhoneMockup({
  children,
  tilt,
}: {
  children: React.ReactNode;
  tilt: 'left' | 'up' | 'right';
}) {
  const tiltClass =
    tilt === 'left' ? 'translate-y-6 -rotate-3'
    : tilt === 'right' ? 'translate-y-6 rotate-3'
    : '';
  return (
    <div className={`relative ${tiltClass}`}>
      <div className="rounded-[28px] bg-ink p-1.5 shadow-[0_30px_60px_-20px_rgba(26,31,27,0.35)]">
        <div className="rounded-[22px] bg-bg-elevated overflow-hidden aspect-[9/19.5] relative">
          {/* notch */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-ink rounded-full z-10" />
          {children}
        </div>
      </div>
    </div>
  );
}

function MockHeader({ title }: { title: string }) {
  return (
    <div className="pt-6 pb-2 px-3">
      <div className="text-[5px] uppercase tracking-[0.18em] text-ink-faint font-semibold">Fairway</div>
      <div className="text-[10px] font-semibold text-ink truncate">{title}</div>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="text-[8px]">
      <MockHeader title="Ledger" />
      <div className="px-2">
        <div className="card-money rounded-2xl p-2.5 relative text-center">
          <div className="relative z-10">
            <div className="text-[5px] uppercase tracking-[0.18em] text-rolex-ink/60 font-semibold">Career</div>
            <div className="mt-1 display text-rolex-gold text-[20px] leading-none whitespace-nowrap">+$284</div>
            <div className="mt-1.5 text-[5px] text-rolex-ink/70">8 rounds on the books</div>
          </div>
        </div>
        <div className="mt-2 space-y-1.5">
          {[
            { course: 'Pebble Beach', date: 'May 14', net: '+$30', settled: false },
            { course: 'Bandon Dunes', date: 'May 7', net: '−$12', settled: true },
            { course: 'Whistling Straits', date: 'Apr 28', net: '+$24', settled: true },
          ].map((r) => (
            <div key={r.course} className="card !p-2 flex items-center gap-1.5">
              <div className="shrink-0 w-4 h-4 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-[5px] font-semibold text-accent">
                {r.course.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[7px] font-semibold truncate">{r.course}</div>
                <div className="text-[5px] text-ink-faint">{r.date}</div>
              </div>
              <div className={`shrink-0 text-[8px] font-bold whitespace-nowrap ${r.net.startsWith('+') ? 'text-accent' : 'text-loss'}`}>
                {r.net}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoundMock() {
  return (
    <div className="text-[8px]">
      <div className="pt-6 pb-2 px-3 flex items-center gap-1.5">
        <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center display text-[8px] text-accent border border-accent/40 bg-accent/5">
          PB
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[5px] uppercase tracking-[0.18em] text-ink-faint font-semibold">Nassau</div>
          <div className="text-[9px] font-semibold text-ink truncate">Pebble Beach</div>
        </div>
      </div>
      <div className="px-2 space-y-1.5">
        <div className="card !p-2">
          <div className="text-[6px] uppercase tracking-[0.15em] text-ink-faint font-semibold mb-1">Players</div>
          {['Noah', 'Kevin', 'Jake', 'Will'].map((n, i) => (
            <div key={n} className={`flex items-center justify-between py-0.5 ${i ? 'border-t border-line' : ''}`}>
              <span className={`text-[7px] ${i === 0 ? 'font-semibold text-accent' : 'text-ink'}`}>{n}</span>
              <span className="text-[6px] text-ink-faint">@{n.toLowerCase()}</span>
            </div>
          ))}
        </div>
        <div className="card !p-2">
          <div className="text-[6px] uppercase tracking-[0.15em] text-ink-faint font-semibold mb-1">Side bets</div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[7px] text-ink">Closest to pin · 7</span>
            <span className="text-[8px] font-bold text-ink">$5</span>
          </div>
          <div className="flex items-center justify-between py-0.5 border-t border-line">
            <span className="text-[7px] text-ink">Longest drive · 18</span>
            <span className="text-[8px] font-bold text-ink">$10</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettleMock() {
  return (
    <div className="text-[8px]">
      <MockHeader title="Settle up" />
      <div className="px-2">
        <div className="card-money rounded-2xl p-2.5 relative text-center">
          <div className="relative z-10">
            <div className="text-[5px] uppercase tracking-[0.18em] text-rolex-ink/60 font-semibold">Total</div>
            <div className="mt-1 display text-rolex-ink text-[20px] leading-none whitespace-nowrap">$45.00</div>
            <div className="mt-1.5 text-[5px] text-rolex-ink/70">2 payouts</div>
          </div>
        </div>
        <div className="mt-2 space-y-1.5">
          {[
            { from: 'Kevin', to: 'Noah', amount: '$30', settled: true },
            { from: 'Jake', to: 'Noah', amount: '$15', settled: false },
          ].map((p, i) => (
            <div key={i} className="card !p-2">
              <div className="flex items-center gap-1.5">
                <div className="shrink-0 w-4 h-4 rounded-full bg-bg-sunken border border-line flex items-center justify-center text-[5px] font-semibold">
                  {p.from[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[7px] font-semibold truncate">
                    {p.from} <span className="text-ink-faint">→</span> {p.to}
                  </div>
                </div>
                <div className="shrink-0 text-[8px] font-bold text-ink whitespace-nowrap">{p.amount}</div>
              </div>
              <div className={`mt-1 text-[6px] font-medium ${p.settled ? 'text-accent' : 'text-amber'}`}>
                {p.settled ? <><Check className="inline w-2 h-2" /> Settled</> : 'Open Venmo'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
