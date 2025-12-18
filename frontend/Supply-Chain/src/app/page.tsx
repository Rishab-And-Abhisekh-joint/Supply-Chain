'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Package } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/signup');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while determining auth state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
            <Package className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-bold text-gray-900">SupplyChain</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}