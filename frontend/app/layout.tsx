import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import './globals.css';
import '@mysten/dapp-kit/dist/index.css';

export const metadata: Metadata = {
  title: 'TravelOS — Multi-Agent Autonomous Travel Treasury',
  description:
    'Multi-Agent Autonomous Travel Treasury on Sui. AI-powered travel planning, treasury management, yield optimization, and on-chain reservations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
