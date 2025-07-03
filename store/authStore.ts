// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  company_website?: string;
  pan_number?: string;
  created_at: string;
  updated_at: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};

type AuthActions = {
  login: (user: User, token: string) => void;
  signup: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User) => void;
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,
      login: (user, token) => set({ user, token, isAuthenticated: true, error: null }),
      signup: (user, token) => set({ user, token, isAuthenticated: true, error: null }),
      logout: () => set(initialState),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }), // persist only these values
    }
  )
);

// Utility function to check auth status
export const checkAuth = async () => {
  try {
    useAuthStore.getState().setLoading(true);
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Not authenticated');
    }

    const data = await response.json();
    if (data.success && data.user) {
      useAuthStore.getState().login(data.user, data.token || '');
      return true;
    }
    return false;
  } catch (error) {
    useAuthStore.getState().logout();
    return false;
  } finally {
    useAuthStore.getState().setLoading(false);
  }
};