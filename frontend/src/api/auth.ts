import { client, REFRESH_TOKEN_KEY } from '@/api/client';
import type { AuthResponse, StudentRegistrationPayload, UserSummary } from '@/types';

export async function loginRequest(email: string, password: string) {
  const response = await client.post<AuthResponse>('/api/auth/login/', { email, password });
  return response.data;
}

export async function registerStudentRequest(payload: StudentRegistrationPayload) {
  const response = await client.post<AuthResponse>('/api/auth/register/student/', payload);
  return response.data;
}

export async function logoutRequest(refreshToken: string | null) {
  if (!refreshToken) {
    return;
  }
  await client.post('/api/auth/logout/', { refresh: refreshToken });
}

export async function refreshRequest(refreshToken: string) {
  const response = await client.post<{ access: string }>('/api/auth/refresh/', { refresh: refreshToken });
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await client.get<UserSummary>('/api/auth/me/');
  return response.data;
}

export function getStoredRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}
