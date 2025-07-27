// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';

// type User = {
//   id: number;
//   full_name: string;
//   email: string;
//   phone_number?: string;
//   company_website?: string;
//   pan_number?: string;
//   created_at: string;
//   updated_at: string;
// };

// type AuthState = {
//   user: User | null;
//   accessToken: string | null;
//   refreshToken: string | null;
//   isAuthenticated: boolean;
//   loading: boolean;
//   error: string | null;
// };

// type AuthActions = {
//   login: (user: User, accessToken: string, refreshToken: string) => void;
//   signup: (user: User, accessToken: string, refreshToken: string) => void;
//   logout: () => void;
//   setLoading: (loading: boolean) => void;
//   setError: (error: string | null) => void;
//   setUser: (user: User) => void;
//   setTokens: (accessToken: string, refreshToken: string) => void;
// };

// const initialState: AuthState = {
//   user: null,
//   accessToken: null,
//   refreshToken: null,
//   isAuthenticated: false,
//   loading: false,
//   error: null,
// };

// export const useAuthStore = create<AuthState & AuthActions>()(
//   persist(
//     (set) => ({
//       ...initialState,
//       login: (user, accessToken, refreshToken) => set({ 
//         user, 
//         accessToken, 
//         refreshToken, 
//         isAuthenticated: true, 
//         error: null 
//       }),
//       signup: (user, accessToken, refreshToken) => set({ 
//         user, 
//         accessToken, 
//         refreshToken, 
//         isAuthenticated: true, 
//         error: null 
//       }),
//       logout: () => set(initialState),
//       setLoading: (loading) => set({ loading }),
//       setError: (error) => set({ error }),
//       setUser: (user) => set({ user }),
//       setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
//     }),
//     {
//       name: 'auth-storage',
//       partialize: (state) => ({ 
//         user: state.user,
//         refreshToken: state.refreshToken,
//         isAuthenticated: state.isAuthenticated 
//       }),
//     }
//   )
// );

// export const checkAuth = async () => {
//   try {
//     useAuthStore.getState().setLoading(true);
//     const response = await fetch('/api/auth/me', {
//       credentials: 'include',
//     });

//     if (!response.ok) {
//       throw new Error('Not authenticated');
//     }

//     const data = await response.json();
//     if (data.success && data.user) {
//       useAuthStore.getState().login(data.user, data.accessToken, data.refreshToken);
//       return true;
//     }
//     return false;
//   } catch (error) {
//     useAuthStore.getState().logout();
//     return false;
//   } finally {
//     useAuthStore.getState().setLoading(false);
//   }
// };

// export const refreshAccessToken = async () => {
//   try {
//     const { refreshToken } = useAuthStore.getState();
//     if (!refreshToken) throw new Error('No refresh token available');

//     const response = await fetch('/api/auth/refresh', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ refreshToken }),
//     });

//     if (!response.ok) {
//       throw new Error('Failed to refresh token');
//     }

//     const data = await response.json();
//     if (data.success && data.accessToken) {
//       useAuthStore.getState().setTokens(data.accessToken, refreshToken);
//       return data.accessToken;
//     }
//     return null;
//   } catch (error) {
//     console.error('Token refresh failed:', error);
//     useAuthStore.getState().logout();
//     return null;
//   }
// };













import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: number;
  full_name: string;
  email: string;
  role: string; // Explicitly including role field
  phone_number?: string;
  company_website?: string;
  pan_number?: string;
  created_at: string;
  updated_at: string;
};

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
    (set) => ({
      ...initialState,
      login: (user, accessToken, refreshToken) => set({ 
        user: {
          ...user,
          role: user.role || 'Admin' // Ensure role is set, default to 'Admin' if not provided
        }, 
        accessToken, 
        refreshToken, 
        isAuthenticated: true, 
        error: null,
        loading: false
      }),
      signup: (user, accessToken, refreshToken) => set({ 
        user: {
          ...user,
          role: user.role || 'Admin' // Ensure role is set, default to 'Admin' if not provided
        },
        accessToken, 
        refreshToken, 
        isAuthenticated: true, 
        error: null,
        loading: false
      }),
      logout: () => set(initialState),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setUser: (user) => set({ 
        user: {
          ...user,
          role: user.role || 'Admin' // Ensure role is set when updating user
        }
      }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

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
      useAuthStore.getState().login(
        { ...data.user, role: data.user.role || 'Admin' },
        data.accessToken,
        data.refreshToken
      );
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

export const refreshAccessToken = async () => {
  try {
    const { refreshToken } = useAuthStore.getState();
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
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken || refreshToken);
      return data.accessToken;
    }
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    useAuthStore.getState().logout();
    return null;
  }
};