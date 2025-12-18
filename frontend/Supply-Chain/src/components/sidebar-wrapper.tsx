'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Sidebar from './sidebar';

// Routes that should not show sidebar
const noSidebarRoutes = ['/', '/login', '/signup', '/forgot-password'];

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  // Don't show sidebar on public routes or when not authenticated
  const showSidebar = isAuthenticated && !noSidebarRoutes.includes(pathname);

  if (isLoading) {
    return <>{children}</>;
  }

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}