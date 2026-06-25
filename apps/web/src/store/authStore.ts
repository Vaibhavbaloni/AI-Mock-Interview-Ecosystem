// apps/web/src/store/authStore.ts
import { create } from 'zustand';
import { api } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  profile?: {
    fullName: string;
    avatarUrl?: string;
    headline?: string;
    bio?: string;
  };
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; role: string; fullName: string }) => Promise<void>;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, accessToken } = response.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Failed to login. Check credentials.';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', data);
      const { user, accessToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Failed to register.';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  fetchUser: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/users/me');
      const userData = response.data.data;
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (err) {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
