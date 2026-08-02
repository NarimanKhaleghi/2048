import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e8ecf4' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a1a' },
  ],
};

export const metadata: Metadata = {
  title: 'Neon 2048',
  description: 'The classic 2048 puzzle reborn as a Neon Arcade — installable, offline-first, bilingual.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '2048',
  },
  icons: {
    icon: '/icons/icon-512.svg',
    apple: '/icons/icon-512.svg',
  },
  openGraph: {
    title: 'Neon 2048',
    description: 'Merge, glow, ascend.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
