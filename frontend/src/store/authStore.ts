import { create } from 'zustand';

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/api/client';
import {
  fetchCurrentUser,
  getStoredRefreshToken,
  loginRequest,
  logoutRequest,
  registerStudentRequest,
  refreshRequest,
} from '@/api/auth';
import type { StudentRegistrationPayload, UserSummary } from '@/types';

interface AuthState {
  user: UserSummary | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  hydrated: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<UserSummary>;
  registerStudent: (payload: StudentRegistrationPayload) => Promise<UserSummary>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  setUser: (user: UserSummary | null) => void;
}

function readToken(key: string) {
  return window.localStorage.getItem(key);
}

function writeTokens(access: string | null, refresh: string | null) {
  if (access) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
  if (refresh) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  hydrated: false,
  isAuthenticated: false,
  async initialize() {
    if (get().hydrated || get().isLoading) {
      return;
    }
    set({ isLoading: true });
    const accessToken = readToken(ACCESS_TOKEN_KEY);
    const refreshToken = readToken(REFRESH_TOKEN_KEY);
    set({ accessToken, refreshToken });
    try {
      if (accessToken) {
        const user = await fetchCurrentUser();
        set({ user, isAuthenticated: true });
      } else if (refreshToken) {
        await get().refresh();
        const user = await fetchCurrentUser();
        set({ user, isAuthenticated: true });
      }
    } catch {
      writeTokens(null, null);
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    } finally {
      set({ hydrated: true, isLoading: false });
    }
  },
  async login(email, password) {
    set({ isLoading: true });
    try {
      const payload = await loginRequest(email, password);
      writeTokens(payload.access, payload.refresh);
      set({
        user: payload.user,
        accessToken: payload.access,
        refreshToken: payload.refresh,
        isAuthenticated: true,
        hydrated: true,
      });
      return payload.user;
    } finally {
      set({ isLoading: false });
    }
  },
  async registerStudent(payload) {
    set({ isLoading: true });
    try {
      const authPayload = await registerStudentRequest(payload);
      writeTokens(authPayload.access, authPayload.refresh);
      set({
        user: authPayload.user,
        accessToken: authPayload.access,
        refreshToken: authPayload.refresh,
        isAuthenticated: true,
        hydrated: true,
      });
      return authPayload.user;
    } finally {
      set({ isLoading: false });
    }
  },
  async logout() {
    const refreshToken = get().refreshToken ?? getStoredRefreshToken();
    try {
      await logoutRequest(refreshToken);
    } catch {
      // ignore logout errors; local state still needs to clear
    } finally {
      writeTokens(null, null);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        hydrated: true,
      });
    }
  },
  async refresh() {
    const refreshToken = get().refreshToken ?? getStoredRefreshToken();
    if (!refreshToken) {
      return null;
    }
    const payload = await refreshRequest(refreshToken);
    writeTokens(payload.access, refreshToken);
    set({
        accessToken: payload.access,
        refreshToken,
        isAuthenticated: true,
    });
    return payload.access;
  },
  setUser(user) {
    set({ user, isAuthenticated: Boolean(user) });
  },
}));
