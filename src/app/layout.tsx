import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AccountProvider } from '@/lib/account-context';
import ThemeProvider from '@/components/theme/ThemeProvider';

import { SidebarProvider } from '@/components/layout/sidebar-context';

export const metadata: Metadata = {
  title: 'DeyeCloud Solar Operations | Multi-Account Mission Control',
  description: 'Enterprise Deye Solar Inverter Telemetry, Multi-Account Fleet Synoptics, Arbitrage Management, and Harmonic Analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground font-sans antialiased min-h-screen selection:bg-primary/20 selection:text-primary">
        <ThemeProvider>
          <AccountProvider>
            <SidebarProvider>
              <div className="min-h-screen flex w-full bg-background">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                  <Header />
                  <main className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1680px] mx-auto flex-1">
                    {children}
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </AccountProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
