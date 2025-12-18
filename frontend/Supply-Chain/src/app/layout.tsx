import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { SidebarWrapper } from '@/components/sidebar-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Supply Chain Platform',
  description: 'AI-powered supply chain management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SidebarWrapper>{children}</SidebarWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}