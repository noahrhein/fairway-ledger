import './globals.css';
import type { Metadata } from 'next';
import { TabBar } from '../components/TabBar';

export const metadata: Metadata = {
  title: 'Fairway Ledger',
  description: 'Track golf bets and settle up fast.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-[480px] min-h-screen px-4 py-6 pb-32">
          {children}
        </div>
        <TabBar />
      </body>
    </html>
  );
}
