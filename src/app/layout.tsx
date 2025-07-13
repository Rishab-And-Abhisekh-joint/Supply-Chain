
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/app-layout';
import { ThemeProvider } from '@/components/theme-provider';
import { auth } from '@/lib/firebase';

// Metadata cannot be exported from a Client Component, so we handle title tag directly.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>SupplyChainAI</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <AppLayout>{children}</AppLayout>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
