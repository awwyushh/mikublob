import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { PwaRegister } from '@/components/pwa-register';
import { PwaInstallToast } from '@/components/pwa-install-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MikuBlob',
  description: 'Track learning, one Blob at a time.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MikuBlob'
  },
  icons: {
    apple: [{ url: '/pwa-icon/180', sizes: '180x180', type: 'image/png' }],
    icon: [
      { url: '/pwa-icon/192', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-icon/512', sizes: '512x512', type: 'image/png' }
    ]
  }
};

const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('mikublob-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = saved || (prefersDark ? 'dark' : 'light');
      if (theme === 'dark') document.documentElement.classList.add('dark');
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <PwaRegister />
        {children}
        <PwaInstallToast />
      </body>
    </html>
  );
}
