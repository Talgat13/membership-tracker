import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Membership Fee & Bank Statement Matcher (₾ GEL)',
  description: 'Automated tracking and matching of monthly club membership fees against Georgian bank statements',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen antialiased selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
