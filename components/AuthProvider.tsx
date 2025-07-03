// src/components/AuthProvider.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore, checkAuth } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, logout } = useAuthStore();

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth();
      
      // If not authenticated and not on a public page, redirect to login
      if (!isAuth && !['/login', '/signup'].includes(pathname)) {
        router.push('/login');
      }
      
      // If authenticated and on login/signup page, redirect to home
      if (isAuth && ['/login', '/signup'].includes(pathname)) {
        router.push('/');
      }
    };

    verifyAuth();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}