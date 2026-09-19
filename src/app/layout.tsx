import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AccountProvider } from '@/lib/account-context';

export const metadata: Metadata = {
  title: 'DeyeCloud Solar Operations | Multi-Account Mission Control',
  description: 'Enterprise Deye Solar Inverter Telemetry, Multi-Account Fleet Synoptics, and Arbitrage Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface font-body-md antialiased min-h-screen">
        <AccountProvider>
          <Sidebar />
          <div className="pl-72 transition-all duration-300 min-h-screen flex flex-col">
            <Header />
            <main className="pt-16 px-8 py-6 w-full flex-1 bg-surface">
              {children}
            </main>
          </div>
        </AccountProvider>
      </body>
    </html>
  );
}
