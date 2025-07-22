'use client';

import { useEffect } from 'react';
import { useAuthStore, checkAuth, refreshAccessToken } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, logout, accessToken } = useAuthStore();

  useEffect(() => {
    // Token refresh interval
    let refreshInterval: NodeJS.Timeout;

    const setupAuth = async () => {
      const isAuth = await checkAuth();
      
      if (isAuth) {
        // Set up token refresh (every 29 minutes)
        refreshInterval = setInterval(async () => {
          await refreshAccessToken();
        }, 29 * 60 * 1000);
      }

      // Redirect logic
      if (!isAuth && !['/login', '/signup'].includes(pathname)) {
        router.push('/login');
      }
      
      if (isAuth && ['/login', '/signup'].includes(pathname)) {
        router.push('/');
      }
    };

    setupAuth();

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
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