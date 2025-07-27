import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Base user type with common fields
type BaseUser = {
  id: number;
  email: string;
  role: 'admin' | 'manager';
  phone_number?: string;
  created_at: string;
  updated_at: string;
};

// Admin-specific fields
type AdminUser = BaseUser & {
  role: 'admin';
  full_name: string;
  email: string;
  phone_number: string;
  company_website?: string;
  pan_number?: string;
};

// Manager-specific fields
type EmployeeUser = BaseUser & {
  role: 'manager';
  employee_id: string;
  manager_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  current_address?: string;
  permanent_address?: string;
  marital_status?: string;
  blood_group?: string;
};

type User = AdminUser | EmployeeUser;

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};

type AuthActions = {
  login: (user: User, accessToken: string, refreshToken: string) => void;
  signup: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  checkAuth: () => Promise<boolean>;
  refreshAccessToken: () => Promise<string | null>;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      login: (user, accessToken, refreshToken) => set({ 
        user,
        accessToken, 
        refreshToken, 
        isAuthenticated: true, 
        error: null,
        loading: false
      }),
      
      signup: (user, accessToken, refreshToken) => set({ 
        user,
        accessToken, 
        refreshToken, 
        isAuthenticated: true, 
        error: null,
        loading: false
      }),
      
      logout: () => {
        // Clear HTTP-only cookies by hitting logout endpoint
        fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        }).catch(console.error);
        
        set(initialState);
      },
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      setUser: (user) => set({ user }),
      
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      
      checkAuth: async () => {
        try {
          set({ loading: true });
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Not authenticated');
          }

          const data = await response.json();
          if (data.success && data.user) {
            get().login(data.user, data.accessToken || get().accessToken, data.refreshToken || get().refreshToken);
            return true;
          }
          return false;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Authentication failed' });
          get().logout();
          return false;
        } finally {
          set({ loading: false });
        }
      },
      
      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) throw new Error('No refresh token available');

          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Failed to refresh token');
          }

          const data = await response.json();
          if (data.success && data.accessToken) {
            get().setTokens(data.accessToken, data.refreshToken || refreshToken);
            return data.accessToken;
          }
          return null;
        } catch (error) {
          console.error('Token refresh failed:', error);
          set({ error: error instanceof Error ? error.message : 'Token refresh failed' });
          get().logout();
          return null;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated 
      }),
      version: 1 // Increment if you make breaking changes to the store structure
    }
  )
);

// Type guard functions
export function isAdminUser(user: User): user is AdminUser {
  return user.role === 'admin';
}

export function isManagerUser(user: User): user is EmployeeUser {
  return user.role === 'manager';
}

// Helper hooks for specific user types
export const useAdminUser = () => {
  const user = useAuthStore(state => state.user);
  return user && isAdminUser(user) ? user : null;
};

export const useManagerUser = () => {
  const user = useAuthStore(state => state.user);
  return user && isManagerUser(user) ? user : null;
};