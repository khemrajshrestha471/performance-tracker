// src/lib/auth/logout.ts
import { useAuthStore } from '@/store/authStore';

export const logout = async () => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    useAuthStore.getState().logout();
  }
};