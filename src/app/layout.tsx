import type { Metadata, Viewport } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import RuntimeStyles from '@/components/ui/RuntimeStyles';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif', style: ['normal', 'italic'] });

export const metadata: Metadata = {
  title: 'Reader',
  description: 'Read, highlight and remember',
  applicationName: 'Reader',
  appleWebApp: { capable: true, title: 'Reader', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#0d1116',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${serif.variable}`}>
      <body className="font-sans bg-bg text-ink-ui antialiased">
        <RuntimeStyles />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
