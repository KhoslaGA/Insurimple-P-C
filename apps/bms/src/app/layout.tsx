import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Insurimple — P&C',
  description: 'Insurimple P&C broker management — quote workspace.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // No data-theme = the default Insurimple tenant palette. White-label tenants set
  // data-theme="klc" | "northpeak" (or data-vertical=…) to re-skin from the same tokens.
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
