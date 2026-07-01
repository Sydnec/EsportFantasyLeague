import { create } from 'zustand';
import { apiClient } from '../api/client';
import { type User, type ApiResponse } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  startProactiveRefresh: () => void;
  stopProactiveRefresh: () => void;
}

let refreshTimer: ReturnType<typeof setInterval> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,

  login: async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ isAuthenticated: true });
    try {
      const res = await apiClient.get<ApiResponse<User>>('/users/me');
      set({ user: res.data.data });
    } catch {
      // will be fetched on next load
    }
    // Start proactive refresh after login
    get().startProactiveRefresh();
  },

  logout: () => {
    get().stopProactiveRefresh();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    if (!localStorage.getItem('accessToken')) return;
    set({ isLoading: true });
    try {
      const res = await apiClient.get<ApiResponse<User>>('/users/me');
      set({ user: res.data.data, isAuthenticated: true });
    } catch (err: any) {
      // Only log out on explicit 401, not on network errors or other transient failures
      if (err?.response?.status === 401) {
        set({ user: null, isAuthenticated: false });
      }
      // For network errors, keep the current state — user might just be offline momentarily
    } finally {
      set({ isLoading: false });
    }
  },

  startProactiveRefresh: () => {
    // Clear any existing timer
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    // Refresh token every 90 minutes (access token lasts 2h)
    refreshTimer = setInterval(async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return;
      try {
        const { data } = await apiClient.post('/auth/refresh');
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      } catch {
        // Refresh failed — the response interceptor will handle logout if needed
      }
    }, 90 * 60 * 1000); // 90 minutes
  },

  stopProactiveRefresh: () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  },
}));
